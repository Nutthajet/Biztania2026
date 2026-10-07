import { products } from '@/data/demo';
export async function getInventory(simulateFailure = false) {
  if (simulateFailure)
    throw new Error('ไม่สามารถอัปเดต Inventory ได้ กรุณาเชื่อมต่อ WMS แล้วลองอีกครั้ง');
  return Object.fromEntries(products.map((p) => [p.id, p.inventory]));
}
