# AI Sales Decision & Action Concierge

A competition-ready, interactive prototype for B2B distributors and wholesalers.

The primary interface language is **Thai**. Brand names, customer/product/rep names, and established English business terms (CRM, ERP, Gross Margin, Sales Rep, Create Task, and similar labels) are preserved. Concierge accepts Thai and English questions, including Thai hour units and Thai numerals. DM Sans and Noto Sans Thai are bundled locally; dates use Thai labels with the Gregorian calendar for consistency with the demo date. Existing saved action records retain their original wording; newly created actions use Thai.

**Fragmented enterprise data → reasoning → resource allocation → decision → action.**

## Problem

Sales teams search across CRM, ERP, inventory, transactions, pricing, and staffing systems to decide which accounts to visit. Familiar accounts attract attention even when inventory, margin, territory, or limited sales capacity make another visit more valuable.

## Solution and differentiation

The Concierge is a decision layer above existing systems. It allocates scarce sales-hours using expected business value and operating constraints, explains each decision with source evidence, and prepares the next action.

This is a **multi-constraint sales resource allocation** prototype. It goes beyond listing likely buyers: a high-probability sale can be deferred because its stock or representative is unavailable. A feasible alternative product can be offered instead.

## Run instructions

Requirements: Node.js 22.13+ and npm. Development was verified with Node 22.19.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. No API keys, external accounts, or backend setup are required. Fonts are bundled locally. All data and actions are simulated.

For a production build:

```sh
npm run build
npm start
```

Verification:

```sh
npm run typecheck
npm test
npm run format:check
```

If port 3000 is busy: `npm run dev -- --port 3001`.

## Technology and structure

Next.js App Router, React, TypeScript, Lucide icons, a custom token-based CSS design system, and a responsive SVG opportunity radar. There was no pre-existing repository or component library to preserve. CSS is used directly to keep precise control over the dense enterprise interface. No charting dependency, server, or real LLM is needed.

```text
src/
  app/                      Root page, layout, and design tokens/styles
  components/
    SalesApp.tsx            Application shell and orchestration
    AllocationTable.tsx     Ranked plan, filters, and export
    ReasoningPanel.tsx      Evidence and action controls
    OpportunityRadar.tsx    Probability × margin; bubble area ∝ revenue
    Assistant.tsx           Contextual, deterministic assistant
    ActionModal.tsx         Editable message, quote, and CRM workflows
    SecondaryViews.tsx      Manager, accounts, team, sources, action log
    ui.tsx                  Shared status, metrics, avatars, capacity bars
  data/demo.ts              24 customers, 18 products, 6 reps, 144 orders
  types/index.ts            Domain contracts
  services/
    mockCrm.ts              Customer adapter
    mockErp.ts              Product and transaction adapters
    mockInventory.ts       Stock adapter with simulated failure
    mockSales.ts            Representative adapter
    enterprise.ts          Asynchronous source composition
  lib/
    customerContext.ts     CRM + historical transaction join
    opportunityScoring.ts  Explainable per-opportunity scoring
    resourceAllocation.ts  Feasible, deterministic allocation
    aiReasoning.ts         Evidence narrative, drafts, assistant intents
    format.ts              Consistent values and labels
tests/allocation.test.ts    Domain and adapter regression tests
```

## Architecture and AI system

```text
CRM ──────────┐
ERP ──────────┤
Inventory ────┤
Sales history ┤ → Predict → Retrieve → Reason → Optimize → Act
Pricing ──────┤             AI decision layer               │
Sales team ───┘                                           ↓
                                   Rep assignment / task / message / quote / CRM
```

- **Remember:** customer preferences and six historical transactions per account.
- **Understand:** order value, industry, territory, reorder timing, and risk.
- **Connect/Retrieve:** join customer IDs, preferred product IDs, sales history, costs, stock, and representative data.
- **Reason:** produce an evidence-based explanation with probability, margin, overdue days, units, promotions, and rep fit.
- **Optimize:** reserve hours and inventory while allocating feasible visits.
- **Act:** create simulated tasks, edit and send simulated messages, prepare quotes, and save simulated CRM updates.

The Data Sources screen visualizes the architecture and includes an inventory-outage simulation. The application retains the last available demo snapshot on failure, identifies the failure, and provides recovery.

## Prototype Decision Model

**This is a deterministic prototype, not a trained ML system, an LLM, or a globally optimal mathematical solver.** The visible “AI” workflow demonstrates where these components fit. Purchase probabilities and churn estimates are supplied mock inputs; the application does not pretend to learn or call a model.

1. Retrieve the latest transaction date and median reorder interval from each customer’s sales history, falling back to CRM fields when history is absent.
2. Determine a whole-unit proposed order: `floor(averageOrderValue / unitPrice)`.
3. Calculate probability-weighted business value:
   - `expectedRevenue = quantity × price × purchaseProbability`
   - `expectedGrossMargin = quantity × (price − cost) × purchaseProbability`
4. Apply transparent priority multipliers:
   - Urgency: `1 + min(overdueDays / reorderCycle, 0.6)`
   - Rep specialization: `1.10` when the industry matches
   - Existing account relationship: `1.05`
   - Active promotion: `1.08`
   - Retention: `1 + churnRisk × 0.12`
5. Divide the weighted expected margin by required visit hours. Normalize with a fixed reference scale: `min(99, round(valuePerHour / 110))`. Scores remain comparable across scenarios. A score of 70 or more marks the “High value” filter.
6. Sort by weighted value per hour; deterministically choose a feasible rep in the same territory. Prefer the customer’s first feasible preferred product, otherwise consider the next preferred product. Consume both the rep’s remaining hours and the shared stock pool when admitting a visit.

Hard constraints:

- Total planning budget: 5–40 hours.
- Per-representative availability, capped at their declared availability.
- Representative territory equals customer territory.
- Visit duration fits the customer’s availability.
- Product margin meets the selected threshold.
- Full order quantity fits the remaining shared inventory.
- At most one visit per customer.

The inventory-disruption scenario uses 10% of each product’s stock. Promotions boost priority but do **not** invent a discount. Price and cost remain authoritative for value calculations.

This greedy heuristic is feasible and explainable, but may leave a remaining hour unused when all visits take two or three hours. It does not guarantee maximal revenue or gross margin; urgency and retention intentionally affect priority. A production solver would replace it.

The standard preview uses **20h**, a **20% minimum product margin**, normal stock, and full rep availability. ABC Foods ranks first, assigned to Sarah for 3h, with approximately ฿72K expected revenue and ฿18.5K expected gross margin. Initial results are explicitly labeled **Preview ready**; **Run AI Allocation** demonstrates retrieval and analysis before marking the refreshed result ready.

## Interaction and action behavior

- The capacity slider, margin threshold, stock scenario, and individual rep sliders recalculate immediately. Running again re-fetches all mock adapters and displays the connection/analyzing/optimizing sequence.
- Selecting a table row or radar bubble opens its evidence. The full explanation is expandable.
- The contextual assistant handles customer explanations, 5–40 hour capacity requests, churn risk, high-margin inventory, and reallocation using current data. Unrecognized questions receive a grounded summary and supported suggestions.
- Task creation is deduplicated for each customer/product. Saved tasks are scheduled consecutively from 10:00 Bangkok time and cannot exceed the rep’s declared daily availability.
- Message text is editable. Quotes use the **full proposed order value**, not probability-weighted pipeline revenue; tax and delivery are excluded.
- All four action types are saved in browser local storage and listed in Action Center. No email, CRM, ERP, or external messaging is contacted.
- Export plan downloads a CSV of the current allocation.
- Opportunities shows all eligible accounts, including deferred visits; Allocation explains why other accounts were deferred.
- Workspace settings reset the planning scenario while retaining saved actions.
- Action Center can clear demo actions for a fresh presentation; an Undo control is available until leaving that screen.
- Demo dates are fixed: **7 October 2026**, planning for **8 October 2026**. This keeps urgency and the competition narrative reproducible.

## 2–3 minute demo flow

1. **0:00–0:20 — Connect.** Open Overview. Explain: “We only have 20 sales-hours tomorrow. Where should we invest them?” Show six sources, then click **Run AI Allocation**.
2. **0:20–0:55 — Reason.** Select ABC Foods. Show 87% probability, 25.7% margin, an eight-day overdue reorder, 2,400 available units, and Sarah’s territory/capacity fit. Expand the full reasoning.
3. **0:55–1:25 — Constrain.** Change capacity from 20h to 10h and rerun. Compare customer count, total hours, gross margin, and rep bars. Optionally switch to the 10% stock scenario to reveal an alternative product.
4. **1:25–1:45 — Explain.** Ask Concierge “Why is ABC Foods ranked #1?” or “What if we only have 5 sales-hours?”
5. **1:45–2:20 — Act.** Select ABC Foods, open **Draft Message**, edit and simulate sending. Click **Create Task** and show the confirmation.
6. **2:20–2:50 — Measure.** Open Manager View for expected margin, utilization, coverage, and the before/after workflow. Open Action Center to show the action trail.

Close with: **“From fragmented information to coordinated action.”**

## Future production architecture

Enterprise APIs → integration/ETL → Customer/Product 360 → feature store → validated purchase and churn models → permission-aware retrieval → grounded LLM reasoning → mathematical allocation solver → audited agent tool calling → CRM/ERP/messaging.

Replace the mock service adapters with authenticated APIs; replace supplied probabilities with monitored models; replace greedy allocation with a mixed-integer/constraint solver supporting travel time, appointment windows, account policies, and stock reservations. Preserve typed contracts and require human review before external actions. Add authentication, tenant isolation, role permissions, source freshness, audit logs, durable workflows, idempotent action APIs, and measured evaluation against actual outcomes.

## Verification

The automated suite checks the default scenario, 360 combinations of constraints, monotonic 5/10/20h demos, stock alternatives, empty states, deterministic rep reassignment, data-grounded assistant/message output, historical retrieval, and inventory-failure handling. Browser checks cover allocation, selection/reasoning, capacity changes, assistant, messages, tasks, quotes, CRM, manager/source/customer/team views, and responsive layouts.

Visual target: restrained warm neutrals, one teal accent, compact navigation, dense tables, source evidence, and contextual actions. Desktop targets are 1440×900 and 1280×800, with stacked panels and a navigation drawer on phones. Reduced-motion preferences are respected.
