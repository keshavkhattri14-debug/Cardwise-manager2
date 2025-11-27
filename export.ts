import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Customer, Transaction } from "@/types";

export async function exportCustomersToCSV(
  customers: Customer[],
  transactions: Transaction[],
  profile: { businessName?: string }
): Promise<void> {
  try {
    // Create CSV header
    const headers = [
      "Name",
      "Business Name",
      "Business Type",
      "Mobile",
      "Email",
      "Address",
      "Total Purchased",
      "Amount Paid",
      "Amount Pending",
      "Last Scanned",
    ];

    // Create CSV rows
    const rows = customers.map((customer) => {
      const customerTx = transactions.filter((t) => t.customerId === customer.id);
      const totalPurchased = customerTx.reduce((sum, t) => sum + t.totalAmount, 0);
      const amountPaid = customerTx.reduce((sum, t) => sum + t.amountPaid, 0);
      const amountPending = totalPurchased - amountPaid;

      return [
        `"${customer.name}"`,
        `"${customer.businessName}"`,
        `"${customer.businessType}"`,
        `"${customer.mobile}"`,
        `"${customer.email}"`,
        `"${customer.address}"`,
        totalPurchased,
        amountPaid,
        amountPending,
        new Date(customer.updatedAt).toLocaleDateString(),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    // Save and share
    const filename = `${profile.businessName || "CardVault"}_Customers_${new Date().toISOString().split("T")[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, csv);
    await Sharing.shareAsync(filePath, {
      mimeType: "text/csv",
      dialogTitle: "Export Customers",
    });
  } catch (error) {
    throw new Error("Failed to export customers to CSV");
  }
}

export async function exportTransactionsToCSV(
  transactions: Transaction[],
  customers: Customer[],
  profile: { businessName?: string; currency?: string }
): Promise<void> {
  try {
    const headers = [
      "Date",
      "Customer Name",
      "Products",
      "Quantity",
      "Total Amount",
      "Amount Paid",
      "Amount Pending",
      "Status",
    ];

    const rows = transactions.map((tx) => {
      const customer = customers.find((c) => c.id === tx.customerId);
      const productNames = tx.products.map((p) => p.name).join("; ");
      const totalQty = tx.products.reduce((sum, p) => sum + p.quantity, 0);
      const pending = tx.totalAmount - tx.amountPaid;

      return [
        `"${new Date(tx.date).toLocaleDateString()}"`,
        `"${customer?.name || "Unknown"}"`,
        `"${productNames}"`,
        totalQty,
        tx.totalAmount,
        tx.amountPaid,
        pending,
        `"${tx.status}"`,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    const filename = `${profile.businessName || "CardVault"}_Transactions_${new Date().toISOString().split("T")[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(filePath, csv);
    await Sharing.shareAsync(filePath, {
      mimeType: "text/csv",
      dialogTitle: "Export Transactions",
    });
  } catch (error) {
    throw new Error("Failed to export transactions to CSV");
  }
}

export function generateReportSummary(
  customers: Customer[],
  transactions: Transaction[],
  profile: { businessName?: string; currency?: string }
): string {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalCollected = transactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const pendingAmount = totalRevenue - totalCollected;

  const report = `
BUSINESS REPORT - ${profile.businessName || "CardVault"}
Generated: ${new Date().toLocaleDateString()}

SUMMARY
=======
Total Customers: ${customers.length}
Total Revenue: ${totalRevenue}
Total Collected: ${totalCollected}
Pending Collection: ${pendingAmount}
Collection Rate: ${totalRevenue > 0 ? ((totalCollected / totalRevenue) * 100).toFixed(1) : 0}%

TRANSACTIONS
============
Total Transactions: ${transactions.length}
Paid: ${transactions.filter((t) => t.status === "paid").length}
Partial: ${transactions.filter((t) => t.status === "partial").length}
Pending: ${transactions.filter((t) => t.status === "pending").length}
`;

  return report;
}
