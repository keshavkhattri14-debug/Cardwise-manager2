import AsyncStorage from "@react-native-async-storage/async-storage";
import { Customer, Transaction, Payment } from "@/types";

const STORAGE_KEYS = {
  CUSTOMERS: "@cardvault/customers",
  TRANSACTIONS: "@cardvault/transactions",
  PAYMENTS: "@cardvault/payments",
  PROFILE: "@cardvault/profile",
};

export interface UserProfile {
  name: string;
  businessName: string;
  currency: string;
}

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const storage = {
  async getCustomers(): Promise<Customer[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveCustomers(customers: Customer[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  async addCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const customers = await this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    await this.saveCustomers(customers);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const customers = await this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    customers[index] = {
      ...customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.saveCustomers(customers);
    return customers[index];
  },

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    await this.saveCustomers(filtered);

    const transactions = await this.getTransactions();
    const filteredTx = transactions.filter((t) => t.customerId !== id);
    await this.saveTransactions(filteredTx);

    const payments = await this.getPayments();
    const filteredPay = payments.filter((p) => p.customerId !== id);
    await this.savePayments(filteredPay);
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  async addTransaction(
    transaction: Omit<Transaction, "id" | "createdAt">
  ): Promise<Transaction> {
    const transactions = await this.getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(newTransaction);
    await this.saveTransactions(transactions);
    return newTransaction;
  },

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    transactions[index] = { ...transactions[index], ...updates };
    await this.saveTransactions(transactions);
    return transactions[index];
  },

  async getPayments(): Promise<Payment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async savePayments(payments: Payment[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  },

  async addPayment(payment: Omit<Payment, "id">): Promise<Payment> {
    const payments = await this.getPayments();
    const newPayment: Payment = {
      ...payment,
      id: generateId(),
    };
    payments.unshift(newPayment);
    await this.savePayments(payments);

    const transactions = await this.getTransactions();
    const txIndex = transactions.findIndex((t) => t.id === payment.transactionId);
    if (txIndex !== -1) {
      const tx = transactions[txIndex];
      const newAmountPaid = tx.amountPaid + payment.amount;
      transactions[txIndex] = {
        ...tx,
        amountPaid: newAmountPaid,
        status:
          newAmountPaid >= tx.totalAmount
            ? "paid"
            : newAmountPaid > 0
              ? "partial"
              : "pending",
      };
      await this.saveTransactions(transactions);
    }

    return newPayment;
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : { name: "", businessName: "", currency: "INR" };
    } catch {
      return { name: "", businessName: "", currency: "INR" };
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  async getCustomerTransactions(customerId: string): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    return transactions.filter((t) => t.customerId === customerId);
  },

  async getCustomerPayments(customerId: string): Promise<Payment[]> {
    const payments = await this.getPayments();
    return payments.filter((p) => p.customerId === customerId);
  },
};
