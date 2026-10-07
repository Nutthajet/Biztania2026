export type Region = 'Bangkok' | 'Central' | 'Eastern';
export interface Customer {
  id: string;
  companyName: string;
  industry: string;
  region: Region;
  purchaseProbability: number;
  churnRisk: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  reorderCycle: number;
  preferredProducts: string[];
  salesRep: string;
  salesHoursAvailable: number;
  requiredHours: number;
  opportunity: 'Reorder' | 'Cross-sell' | 'Retention';
}
export interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  cost: number;
  grossMargin: number;
  inventory: number;
  promotionActive: boolean;
}
export interface SalesRep {
  id: string;
  name: string;
  region: Region;
  availableHours: number;
  currentWorkload: number;
  specialization: string[];
  initials: string;
}
export interface Transaction {
  id: string;
  customer: string;
  product: string;
  date: string;
  quantity: number;
  revenue: number;
  margin: number;
}
export interface EnterpriseData {
  customers: Customer[];
  products: Product[];
  reps: SalesRep[];
  history: Transaction[];
}
export interface Constraints {
  hours: number;
  minimumMargin: number;
  inventoryMode: 'live' | 'limited';
  repCapacity: Record<string, number>;
}
export interface Opportunity {
  id: string;
  customer: Customer;
  product: Product;
  rep: SalesRep;
  quantity: number;
  expectedRevenue: number;
  expectedMargin: number;
  orderValue: number;
  hours: number;
  score: number;
  objective: number;
  daysSincePurchase: number;
  overdueDays: number;
  inventoryAvailable: number;
  alternative: boolean;
  rank: number;
}
export interface ExcludedOpportunity {
  customer: Customer;
  reason: string;
}
export interface AllocationResult {
  opportunities: Opportunity[];
  candidates: Opportunity[];
  excluded: ExcludedOpportunity[];
  totalHours: number;
  expectedRevenue: number;
  expectedMargin: number;
  repHours: Record<string, number>;
  inventoryUsed: Record<string, number>;
}
export type ActionType = 'task' | 'message' | 'quote' | 'crm';
export interface ActionRecord {
  id: string;
  customerId: string;
  productId: string;
  repId: string;
  hours: number;
  type: ActionType;
  title: string;
  detail: string;
  createdAt: string;
}
export type View =
  | 'Overview'
  | 'Opportunities'
  | 'Allocation'
  | 'Customers'
  | 'Sales Team'
  | 'Data Sources'
  | 'Manager View'
  | 'Action Center';
