import * as Notifications from "expo-notifications";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_ENABLED_KEY = "@cardvault/notifications_enabled";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    return false;
  }
}

export async function isNotificationsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? "true" : "false");
  } catch (error) {
    console.error("Failed to set notifications preference:", error);
  }
}

export async function schedulePendingPaymentNotification(
  customerName: string,
  amount: number,
  daysOverdue: number
): Promise<void> {
  try {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    const message =
      daysOverdue > 0
        ? `Payment overdue by ${daysOverdue} days from ${customerName}: ₹${amount}`
        : `Pending payment from ${customerName}: ₹${amount}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Pending Payment",
        body: message,
        sound: "default",
        badge: 1,
      },
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.error("Failed to schedule notification:", error);
  }
}

export async function checkAndNotifyPendingPayments(
  transactions: any[],
  customers: any[]
): Promise<void> {
  try {
    const enabled = await isNotificationsEnabled();
    if (!enabled) return;

    const today = new Date();
    const pendingTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return t.totalAmount > t.amountPaid && txDate < today;
    });

    for (const tx of pendingTransactions.slice(0, 3)) {
      const customer = customers.find((c) => c.id === tx.customerId);
      if (customer) {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const pendingAmount = tx.totalAmount - tx.amountPaid;
        await schedulePendingPaymentNotification(customer.name, pendingAmount, daysOverdue - 30);
      }
    }
  } catch (error) {
    console.error("Failed to check pending payments:", error);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === "granted";
    }

    return true;
  } catch (error) {
    return false;
  }
}
