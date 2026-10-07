import assert from 'node:assert/strict';
import test from 'node:test';
import { customers, history, products, reps } from '../src/data/demo';
import { allocateResources } from '../src/lib/resourceAllocation';
import { answerQuestion, draftMessage, explainOpportunity } from '../src/lib/aiReasoning';
import { retrieveEnterpriseData } from '../src/services/enterprise';
import type { Constraints } from '../src/types';
import { retrieveCustomerContext } from '../src/lib/customerContext';
const data = { customers, history, products, reps };
const defaults: Constraints = {
  hours: 20,
  minimumMargin: 20,
  inventoryMode: 'live',
  repCapacity: {},
};
test('default competition plan prioritizes ABC Foods and never duplicates customers', () => {
  const r = allocateResources(data, defaults);
  assert.equal(r.opportunities[0].customer.companyName, 'ABC Foods');
  assert.equal(r.opportunities[0].rep.id, 'sarah');
  assert.equal(r.opportunities[0].hours, 3);
  assert.equal(new Set(r.opportunities.map((o) => o.customer.id)).size, r.opportunities.length);
  assert.equal(r.totalHours, 20);
  assert.ok(Math.abs(r.opportunities[0].expectedRevenue - 72036) < 1);
});
test('all budgets, margin levels, and inventory scenarios obey hard constraints', () => {
  for (let hours = 5; hours <= 40; hours++)
    for (const minimumMargin of [0, 20, 30, 35, 50])
      for (const inventoryMode of ['live', 'limited'] as const) {
        const c = {
          ...defaults,
          hours,
          minimumMargin,
          inventoryMode,
          repCapacity: { sarah: 5, james: 4 },
        };
        const r = allocateResources(data, c);
        assert.ok(r.totalHours <= hours);
        for (const rep of reps)
          assert.ok(
            (r.repHours[rep.id] ?? 0) <=
              Math.min(
                rep.availableHours,
                c.repCapacity[rep.id as keyof typeof c.repCapacity] ?? rep.availableHours,
              ),
          );
        for (const p of products)
          assert.ok(
            (r.inventoryUsed[p.id] ?? 0) <=
              Math.floor(p.inventory * (inventoryMode === 'limited' ? 0.1 : 1)),
          );
        for (const o of r.opportunities) {
          assert.equal(o.rep.region, o.customer.region);
          assert.ok(o.product.grossMargin * 100 >= minimumMargin);
        }
        assert.equal(
          r.expectedMargin,
          r.opportunities.reduce((s, o) => s + o.expectedMargin, 0),
        );
        assert.equal(
          r.expectedRevenue,
          r.opportunities.reduce((s, o) => s + o.expectedRevenue, 0),
        );
      }
});
test('5h and 10h plans concentrate on fewer opportunities with lower totals', () => {
  const plans = [5, 10, 20].map((hours) => allocateResources(data, { ...defaults, hours }));
  for (let i = 1; i < plans.length; i++) {
    assert.ok(plans[i].opportunities.length > plans[i - 1].opportunities.length);
    assert.ok(plans[i].expectedMargin > plans[i - 1].expectedMargin);
  }
  assert.equal(plans[0].opportunities[0].customer.id, 'c1');
});
test('out-of-stock products get feasible alternatives and no stock is oversold', () => {
  const r = allocateResources(data, { ...defaults, hours: 40 });
  const build = r.opportunities.find((o) => o.customer.companyName === 'BuildRight Trading')!;
  assert.equal(build.product.id, 'p8');
  assert.equal(build.alternative, true);
  assert.ok(r.opportunities.every((o) => o.product.id !== 'p7'));
});
test('zero team availability and impossible margin produce deliberate empty plans', () => {
  assert.equal(allocateResources(data, { ...defaults, minimumMargin: 50 }).opportunities.length, 0);
  assert.equal(
    allocateResources(data, {
      ...defaults,
      repCapacity: Object.fromEntries(reps.map((r) => [r.id, 0])),
    }).opportunities.length,
    0,
  );
});
test('rep removal changes assignments and allocation remains deterministic', () => {
  const c = { ...defaults, repCapacity: { sarah: 0 } };
  const a = allocateResources(data, c);
  const b = allocateResources(data, c);
  assert.deepEqual(a, b);
  assert.ok(a.opportunities.every((o) => o.rep.id !== 'sarah'));
  assert.equal(a.opportunities.find((o) => o.customer.id === 'c1')?.rep.id, 'james');
});
test('assistant and draft use the actual current data', () => {
  const r = allocateResources(data, defaults);
  const o = r.opportunities[0];
  assert.match(explainOpportunity(o), /87%/);
  assert.match(explainOpportunity(o), /2,400/);
  assert.match(draftMessage(o), /138 หน่วย/);
  assert.match(draftMessage(o), /82,800/);
  assert.match(
    answerQuestion('Why is ABC Foods ranked #1?', data, r, defaults).text,
    /Priority #1/,
  );
  assert.equal(
    answerQuestion('What if we only have 10 sales-hours?', data, r, defaults).capacity,
    10,
  );
  assert.equal(answerQuestion('Use 100 hours', data, r, defaults).capacity, undefined);
  assert.match(
    answerQuestion('Which customers have churn risk?', data, r, defaults).text,
    /CareFirst Pharmacy/,
  );
});
test('all six source retrievals compose and inventory failure rejects refresh', async () => {
  const d = await retrieveEnterpriseData();
  assert.equal(d.customers.length, 24);
  assert.equal(d.history.length, 144);
  assert.equal(d.products.length, 18);
  assert.equal(d.reps.length, 6);
  await assert.rejects(retrieveEnterpriseData(true), /ไม่สามารถอัปเดต Inventory/);
});
test('sales-history retrieval overrides stale CRM purchase dates', () => {
  const context = retrieveCustomerContext(
    { ...customers[0], lastPurchaseDate: '2020-01-01', reorderCycle: 1 },
    history,
  );
  assert.equal(context.lastPurchaseDate, customers[0].lastPurchaseDate);
  assert.equal(context.reorderCycle, 30);
  assert.deepEqual(retrieveCustomerContext(customers[0], []), customers[0]);
});

test('Thai assistant requests preserve the same capacity constraints and customer evidence', () => {
  const r = allocateResources(data, defaults);
  for (const question of [
    'ถ้ามีเวลาแค่ 10 ชั่วโมงล่ะ?',
    'จัดสรรเวลา ๑๐ ชั่วโมง',
    'เหลือเวลา 10 ชม.',
    'Allocate 10 sales-hours',
  ]) {
    assert.equal(answerQuestion(question, data, r, defaults).capacity, 10);
  }
  for (const question of ['จัดสรร 100 ชั่วโมง', 'มีเวลา 2 ชั่วโมง', 'ปรับเป็น 10.5 ชั่วโมง']) {
    assert.equal(answerQuestion(question, data, r, defaults).capacity, undefined);
  }
  const explanation = answerQuestion('ทำไม ABC Foods ได้เวลา 3 ชั่วโมง?', data, r, defaults);
  assert.equal(explanation.capacity, undefined);
  assert.match(explanation.text, /Priority #1/);
  assert.match(explanation.text, /87%/);
  assert.match(explanation.text, /Product Margin 25.7%/);
  assert.match(explanation.text, /Premium Sauce X|สต็อก 2,400/);
  assert.match(
    answerQuestion('ลูกค้ารายไหนเสี่ยงเลิกซื้อ?', data, r, defaults).text,
    /CareFirst Pharmacy/,
  );
  assert.match(answerQuestion('หาโอกาส Margin สูงที่มีสต็อก', data, r, defaults).text, /30%/);
  assert.equal(answerQuestion('ช่วยจัดสรรทีมใหม่อีกครั้ง', data, r, defaults).rerun, true);
  assert.match(draftMessage(r.opportunities[0]), /เรียน ทีมงาน ABC Foods/);
  assert.match(draftMessage(r.opportunities[0]), /Premium Sauce X/);
});
