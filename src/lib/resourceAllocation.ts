import type { AllocationResult, Constraints, EnterpriseData, Opportunity } from '@/types';
import { scoreOpportunity } from './opportunityScoring';
import { retrieveCustomerContext } from './customerContext';
export function allocateResources(
  data: EnterpriseData,
  constraints: Constraints,
): AllocationResult {
  const result: AllocationResult = {
    opportunities: [],
    candidates: [],
    excluded: [],
    totalHours: 0,
    expectedRevenue: 0,
    expectedMargin: 0,
    repHours: {},
    inventoryUsed: {},
  };
  const options = new Map<string, Opportunity[]>();
  for (const crmCustomer of data.customers) {
    const customer = retrieveCustomerContext(crmCustomer, data.history);
    const eligible: Opportunity[] = [];
    for (const productId of customer.preferredProducts) {
      const product = data.products.find((p) => p.id === productId);
      if (!product || product.grossMargin * 100 < constraints.minimumMargin) continue;
      for (const rep of data.reps.filter((r) => r.region === customer.region)) {
        const candidate = scoreOpportunity(customer, product, rep, constraints);
        const capacity = Math.max(
          0,
          Math.min(rep.availableHours, constraints.repCapacity[rep.id] ?? rep.availableHours),
        );
        if (
          candidate.quantity <= candidate.inventoryAvailable &&
          candidate.hours <= capacity &&
          candidate.hours <= customer.salesHoursAvailable
        )
          eligible.push(candidate);
      }
      // Use the customer's preferred product when feasible; consider an alternative otherwise.
      if (eligible.length) break;
    }
    eligible.sort((a, b) => b.objective - a.objective || a.rep.id.localeCompare(b.rep.id));
    options.set(customer.id, eligible);
    if (eligible.length) result.candidates.push(eligible[0]);
    else
      result.excluded.push({
        customer,
        reason:
          'ยังไม่มีคู่สินค้าและ Sales Rep ที่ตรงเงื่อนไข Margin สต็อก พื้นที่ และเวลาว่างครบทุกข้อ',
      });
  }
  const byValue = (a: Opportunity, b: Opportunity) =>
    b.objective / b.hours - a.objective / a.hours || a.customer.id.localeCompare(b.customer.id);
  result.candidates.sort(byValue);
  for (const best of result.candidates) {
    const feasible = options
      .get(best.customer.id)!
      .find(
        (o) =>
          result.totalHours + o.hours <= constraints.hours &&
          (result.repHours[o.rep.id] ?? 0) + o.hours <=
            Math.min(
              o.rep.availableHours,
              constraints.repCapacity[o.rep.id] ?? o.rep.availableHours,
            ) &&
          (result.inventoryUsed[o.product.id] ?? 0) + o.quantity <= o.inventoryAvailable,
      );
    if (!feasible) {
      result.excluded.push({
        customer: best.customer,
        reason:
          'เลื่อนการเข้าพบ: โอกาสที่มีมูลค่าสูงกว่าใช้เวลาทีมขายหรือสต็อกที่เหลืออยู่ แนะนำติดตามทางไกลในระหว่างนี้',
      });
      continue;
    }
    result.opportunities.push({ ...feasible, rank: result.opportunities.length + 1 });
    result.totalHours += feasible.hours;
    result.expectedRevenue += feasible.expectedRevenue;
    result.expectedMargin += feasible.expectedMargin;
    result.repHours[feasible.rep.id] = (result.repHours[feasible.rep.id] ?? 0) + feasible.hours;
    result.inventoryUsed[feasible.product.id] =
      (result.inventoryUsed[feasible.product.id] ?? 0) + feasible.quantity;
  }
  return result;
}
