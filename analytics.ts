import { Customer, Transaction, DashboardStats, RankedCustomer, CustomerStats } from "@/types";

export function getDashboardStats(
  customers: Customer[],
  transactions: Transaction[]
): DashboardStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
  });

  const thisMonthRevenue = thisMonthTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );

  const pendingCollections = transactions.reduce(
    (sum, t) => sum + (t.totalAmount - t.amountPaid),
    0
  );

  const customerTotals = new Map<string, number>();
  thisMonthTransactions.forEach((t) => {
    const current = customerTotals.get(t.customerId) || 0;
    customerTotals.set(t.customerId, current + t.totalAmount);
  });

  let topCustomerId = "";
  let topAmount = 0;
  customerTotals.forEach((amount, customerId) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCustomerId = customerId;
    }
  });

  const topCustomer = customers.find((c) => c.id === topCustomerId) || null;

  return {
    totalCustomers: customers.length,
    thisMonthRevenue,
    pendingCollections,
    topCustomer: {
      customer: topCustomer,
      amount: topAmount,
    },
  };
}

export function getMonthlyRankings(
  customers: Customer[],
  transactions: Transaction[],
  month?: number,
  year?: number
): RankedCustomer[] {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate.getMonth() === targetMonth && txDate.getFullYear() === targetYear;
  });

  const customerStats = new Map<
    string,
    { totalAmount: number; transactionCount: number }
  >();

  monthTransactions.forEach((t) => {
    const current = customerStats.get(t.customerId) || {
      totalAmount: 0,
      transactionCount: 0,
    };
    customerStats.set(t.customerId, {
      totalAmount: current.totalAmount + t.totalAmount,
      transactionCount: current.transactionCount + 1,
    });
  });

  const rankings: RankedCustomer[] = [];
  customerStats.forEach((stats, customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      rankings.push({
        customer,
        rank: 0,
        totalAmount: stats.totalAmount,
        transactionCount: stats.transactionCount,
      });
    }
  });

  rankings.sort((a, b) => b.totalAmount - a.totalAmount);
  rankings.forEach((r, index) => {
    r.rank = index + 1;
  });

  return rankings;
}

export function getCustomerStats(
  customerId: string,
  transactions: Transaction[]
): CustomerStats {
  const customerTransactions = transactions.filter((t) => t.customerId === customerId);

  const totalPurchased = customerTransactions.reduce(
    (sum, t) => sum + t.totalAmount,
    0
  );
  const amountPaid = customerTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const amountPending = totalPurchased - amountPaid;

  const productCounts = new Map<string, number>();
  customerTransactions.forEach((t) => {
    t.products.forEach((p) => {
      const current = productCounts.get(p.name) || 0;
      productCounts.set(p.name, current + p.quantity);
    });
  });

  const topProducts: { name: string; quantity: number }[] = [];
  productCounts.forEach((quantity, name) => {
    topProducts.push({ name, quantity });
  });
  topProducts.sort((a, b) => b.quantity - a.quantity);

  return {
    totalPurchased,
    amountPaid,
    amountPending,
    transactionCount: customerTransactions.length,
    topProducts: topProducts.slice(0, 5),
  };
}

export function getRevenueChartData(
  transactions: Transaction[],
  months: number = 6,
  startDate?: Date,
  endDate?: Date
): { labels: string[]; data: number[] } {
  const now = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    labels.push(monthName);

    const monthRevenue = transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        const inRange = !startDate || !endDate || (txDate >= startDate && txDate <= endDate);
        return (
          inRange &&
          txDate.getMonth() === date.getMonth() &&
          txDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, t) => sum + t.totalAmount, 0);

    data.push(monthRevenue);
  }

  return { labels, data };
}

export function getPaymentStatusData(
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date
): { collected: number; pending: number } {
  const filtered = transactions.filter((t) => {
    const txDate = new Date(t.date);
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });

  const collected = filtered.reduce((sum, t) => sum + t.amountPaid, 0);
  const pending = filtered.reduce(
    (sum, t) => sum + (t.totalAmount - t.amountPaid),
    0
  );
  return { collected, pending };
}

export function getTopProducts(
  transactions: Transaction[],
  limit: number = 5,
  startDate?: Date,
  endDate?: Date
): { name: string; quantity: number; revenue: number }[] {
  const filtered = transactions.filter((t) => {
    const txDate = new Date(t.date);
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });

  const productStats = new Map<string, { quantity: number; revenue: number }>();

  filtered.forEach((t) => {
    t.products.forEach((p) => {
      const current = productStats.get(p.name) || { quantity: 0, revenue: 0 };
      productStats.set(p.name, {
        quantity: current.quantity + p.quantity,
        revenue: current.revenue + p.total,
      });
    });
  });

  const products: { name: string; quantity: number; revenue: number }[] = [];
  productStats.forEach((stats, name) => {
    products.push({ name, ...stats });
  });

  products.sort((a, b) => b.revenue - a.revenue);
  return products.slice(0, limit);
}
