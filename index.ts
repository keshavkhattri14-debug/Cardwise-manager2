export interface Customer {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  businessType: string;
  cardImageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  products: ProductItem[];
  totalAmount: number;
  amountPaid: number;
  status: "paid" | "partial" | "pending";
  notes?: string;
  createdAt: string;
}

export interface ProductItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  transactionId: string;
  customerId: string;
  amount: number;
  date: string;
  method: "cash" | "upi" | "bank" | "other";
  notes?: string;
}

export interface CustomerStats {
  totalPurchased: number;
  amountPaid: number;
  amountPending: number;
  transactionCount: number;
  topProducts: { name: string; quantity: number }[];
}

export interface DashboardStats {
  totalCustomers: number;
  thisMonthRevenue: number;
  pendingCollections: number;
  topCustomer: {
    customer: Customer | null;
    amount: number;
  };
}

export interface RankedCustomer {
  customer: Customer;
  rank: number;
  totalAmount: number;
  transactionCount: number;
}

export interface ExtractedCardData {
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  businessType: string;
}
