import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Platform,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import { getCustomerStats } from "@/utils/analytics";
import { formatCurrency, formatDate, getInitials } from "@/utils/format";
import { Customer, Transaction, CustomerStats } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

type CustomerDetailRouteProp = RouteProp<RootStackParamList, "CustomerDetail">;

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.statItem}>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText type="h4" style={{ color: color || theme.text }}>
        {value}
      </ThemedText>
    </View>
  );
}

function TransactionCard({
  transaction,
  currency,
  index,
  onPress,
}: {
  transaction: Transaction;
  currency: string;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (transaction.status) {
      case "paid":
        return AppColors.secondary;
      case "partial":
        return AppColors.warning;
      default:
        return AppColors.error;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.transactionCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {formatDate(transaction.date)}
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "700" }}>
              {formatCurrency(transaction.totalAmount, currency)}
            </ThemedText>
          </View>
          <View style={styles.transactionDetails}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {transaction.products.length} item(s)
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: getStatusColor(), textTransform: "capitalize" }}
            >
              {transaction.status}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CustomerDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<CustomerDetailRouteProp>();
  const { theme } = useTheme();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "", businessName: "", currency: "INR" });

  const loadData = useCallback(async () => {
    const [customers, allTransactions, profileData] = await Promise.all([
      storage.getCustomers(),
      storage.getTransactions(),
      storage.getProfile(),
    ]);
    const foundCustomer = customers.find((c) => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      const customerTx = allTransactions.filter((t) => t.customerId === customerId);
      setTransactions(customerTx);
      setStats(getCustomerStats(customerId, allTransactions));
    }
    setProfile(profileData);
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleCall = () => {
    if (customer?.mobile) {
      Linking.openURL(`tel:${customer.mobile}`);
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.mobile) {
      const phone = customer.mobile.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${phone}`);
    }
  };

  const handleEdit = () => {
    if (customer) {
      navigation.navigate("EditCustomer", { customer });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer?.name}? This will also delete all their transactions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await storage.deleteCustomer(customerId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddTransaction = () => {
    navigation.navigate("AddTransaction", { customerId });
  };

  if (!customer) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <ScreenScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={[AppColors.primary, AppColors.primaryEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <ThemedText style={styles.avatarText}>
                  {getInitials(customer.name)}
                </ThemedText>
              </LinearGradient>
              <View style={styles.profileActions}>
                <Pressable
                  onPress={handleEdit}
                  style={({ pressed }) => [
                    styles.actionIcon,
                    { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="edit-2" size={18} color={theme.text} />
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.actionIcon,
                    { backgroundColor: AppColors.error + "20", opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="trash-2" size={18} color={AppColors.error} />
                </Pressable>
              </View>
            </View>

            <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
              {customer.name}
            </ThemedText>
            {customer.businessName ? (
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {customer.businessName}
              </ThemedText>
            ) : null}
            {customer.businessType ? (
              <View style={[styles.badge, { backgroundColor: AppColors.primary + "20" }]}>
                <ThemedText type="caption" style={{ color: AppColors.primary }}>
                  {customer.businessType}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.contactInfo}>
              {customer.mobile ? (
                <View style={styles.contactRow}>
                  <Feather name="phone" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                    {customer.mobile}
                  </ThemedText>
                </View>
              ) : null}
              {customer.email ? (
                <View style={styles.contactRow}>
                  <Feather name="mail" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                    {customer.email}
                  </ThemedText>
                </View>
              ) : null}
              {customer.address ? (
                <View style={styles.contactRow}>
                  <Feather name="map-pin" size={16} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
                    {customer.address}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {stats ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault }]}>
              <StatItem
                label="Total Purchased"
                value={formatCurrency(stats.totalPurchased, profile.currency)}
              />
              <StatItem
                label="Amount Paid"
                value={formatCurrency(stats.amountPaid, profile.currency)}
                color={AppColors.secondary}
              />
              <StatItem
                label="Pending"
                value={formatCurrency(stats.amountPending, profile.currency)}
                color={stats.amountPending > 0 ? AppColors.warning : undefined}
              />
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Transactions</ThemedText>
            <Pressable
              onPress={handleAddTransaction}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: AppColors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: 4 }}>
                Add
              </ThemedText>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="file-text" size={40} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}
              >
                No transactions yet. Add one to track sales!
              </ThemedText>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map((tx, index) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currency={profile.currency}
                  index={index}
                  onPress={() =>
                    navigation.navigate("TransactionDetail", {
                      transaction: tx,
                      customerName: customer.name,
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScreenScrollView>

      <View
        style={[
          styles.quickActions,
          { backgroundColor: theme.backgroundRoot, borderTopColor: theme.border },
        ]}
      >
        <Pressable
          onPress={handleCall}
          disabled={!customer.mobile}
          style={({ pressed }) => [
            styles.quickActionButton,
            { backgroundColor: AppColors.secondary, opacity: pressed ? 0.9 : customer.mobile ? 1 : 0.5 },
          ]}
        >
          <Feather name="phone" size={20} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
            Call
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleWhatsApp}
          disabled={!customer.mobile}
          style={({ pressed }) => [
            styles.quickActionButton,
            { backgroundColor: "#25D366", opacity: pressed ? 0.9 : customer.mobile ? 1 : 0.5 },
          ]}
        >
          <Feather name="message-circle" size={20} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
            WhatsApp
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleEmail}
          disabled={!customer.email}
          style={({ pressed }) => [
            styles.quickActionButton,
            { backgroundColor: AppColors.primary, opacity: pressed ? 0.9 : customer.email ? 1 : 0.5 },
          ]}
        >
          <Feather name="mail" size={20} color="#FFFFFF" />
          <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
            Email
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  profileActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  contactInfo: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statsCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  transactionList: {
    gap: Spacing.sm,
  },
  transactionCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  statusIndicator: {
    width: 4,
  },
  transactionContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
  quickActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
