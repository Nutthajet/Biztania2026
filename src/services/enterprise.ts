import { getCustomers } from './mockCrm';
import { getProducts, getSalesHistory } from './mockErp';
import { getInventory } from './mockInventory';
import { getSalesTeam } from './mockSales';
import type { EnterpriseData } from '@/types';
export async function retrieveEnterpriseData(failInventory = false): Promise<EnterpriseData> {
  const [customers, products, inventory, reps, history] = await Promise.all([
    getCustomers(),
    getProducts(),
    getInventory(failInventory),
    getSalesTeam(),
    getSalesHistory(),
  ]);
  return {
    customers,
    products: products.map((p) => ({ ...p, inventory: inventory[p.id] })),
    reps,
    history,
  };
}
