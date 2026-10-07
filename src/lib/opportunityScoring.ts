import { DEMO_DATE } from '@/data/demo';
import type { Constraints, Customer, Opportunity, Product, SalesRep } from '@/types';
export function scoreOpportunity(
  customer: Customer,
  product: Product,
  rep: SalesRep,
  constraints: Constraints,
): Opportunity {
  const quantity = Math.max(1, Math.floor(customer.averageOrderValue / product.price));
  const orderValue = quantity * product.price;
  const expectedRevenue = orderValue * customer.purchaseProbability;
  const expectedMargin = quantity * (product.price - product.cost) * customer.purchaseProbability;
  const daysSincePurchase = Math.round(
    (Date.parse(DEMO_DATE) - Date.parse(customer.lastPurchaseDate)) / 86400000,
  );
  const overdueDays = Math.max(0, daysSincePurchase - customer.reorderCycle);
  const urgency = 1 + Math.min(overdueDays / customer.reorderCycle, 0.6);
  const specialization = rep.specialization.includes(customer.industry) ? 1.1 : 1;
  const relationship = rep.id === customer.salesRep ? 1.05 : 1;
  const promotion = product.promotionActive ? 1.08 : 1;
  const retention = 1 + customer.churnRisk * 0.12;
  const hours = customer.requiredHours;
  const objective =
    expectedMargin * urgency * specialization * relationship * promotion * retention;
  // A fixed reference scale preserves comparability as the constraint set changes.
  const score = Math.min(99, Math.round(objective / hours / 110));
  return {
    id: `${customer.id}-${product.id}`,
    customer,
    product,
    rep,
    quantity,
    orderValue,
    expectedRevenue,
    expectedMargin,
    hours,
    score,
    objective,
    daysSincePurchase,
    overdueDays,
    inventoryAvailable: Math.floor(
      product.inventory * (constraints.inventoryMode === 'limited' ? 0.1 : 1),
    ),
    alternative: product.id !== customer.preferredProducts[0],
    rank: 0,
  };
}
