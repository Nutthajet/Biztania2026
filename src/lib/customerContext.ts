import type { Customer, Transaction } from '@/types';

/** Join CRM preferences with the actual transaction ledger before scoring. */
export function retrieveCustomerContext(customer: Customer, history: Transaction[]): Customer {
  const dates = [...new Set(history.filter((t) => t.customer === customer.id).map((t) => t.date))]
    .filter((d) => Number.isFinite(Date.parse(d)))
    .sort()
    .reverse();
  if (!dates.length) return customer;
  const intervals = dates
    .slice(1)
    .map((date, i) => Math.round((Date.parse(dates[i]) - Date.parse(date)) / 86400000))
    .sort((a, b) => a - b);
  const medianCycle = intervals.length
    ? intervals[Math.floor(intervals.length / 2)]
    : customer.reorderCycle;
  return { ...customer, lastPurchaseDate: dates[0], reorderCycle: Math.max(1, medianCycle) };
}
