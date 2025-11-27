import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { Transaction, Payment } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

type TransactionDetailRouteProp = RouteProp<RootStackParamList, "TransactionDetail">;

function PaymentCard({
  payment,
  currency,
  index,
}: {
  payment: Payment;
  currency: string;
  index: number;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).springify()}>
      <View style={[styles.paymentCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.paymentInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {formatCurrency(payment.amount, currency)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatDateTime(payment.date)}
          </ThemedText>
        </View>
        <View style={[styles.paymentMethod, { backgroundColor: AppColors.secondary + "20" }]}>
          <ThemedText type="caption" style={{ color: AppColors.secondary, textTransform: "uppercase" }}>
            {payment.method}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TransactionDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<TransactionDetailRouteProp>();
  const { theme } = useTheme();
  const { transaction: initialTransaction, customerName } = route.params;

  const [transaction, setTransaction] = useState(initialTransaction);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: "", businessName: "", currency: "INR" });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "bank" | "other">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [allPayments, allTransactions, profileData] = await Promise.all([
      storage.getPayments(),
      storage.getTransactions(),
      storage.getProfile(),
    ]);
    
    const txPayments = allPayments.filter((p) => p.transactionId === transaction.id);
    setPayments(txPayments);
    
    const updatedTx = allTransactions.find((t) => t.id === transaction.id);
    if (updatedTx) {
      setTransaction(updatedTx);
    }
    
    setProfile(profileData);
  }, [transaction.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddPayment = async () => {
    const amount = parseFloat(paymentAmount);
    const pending = transaction.totalAmount - transaction.amountPaid;

    if (!amount || amount <= 0) {
      Alert.alert("Invalid", "Please enter a valid amount.");
      return;
    }

    if (amount > pending) {
      Alert.alert("Invalid", `Amount cannot exceed pending amount of ${formatCurrency(pending, profile.currency)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await storage.addPayment({
        transactionId: transaction.id,
        customerId: transaction.customerId,
        amount,
        date: new Date().toISOString(),
        method: paymentMethod,
      });
      setPaymentAmount("");
      setShowPaymentForm(false);
      await loadData();
    } catch (error) {
      Alert.alert("Error", "Failed to add payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingAmount = transaction.totalAmount - transaction.amountPaid;

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

  const paymentMethods: Array<{ key: "cash" | "upi" | "bank" | "other"; label: string }> = [
    { key: "cash", label: "Cash" },
    { key: "upi", label: "UPI" },
    { key: "bank", label: "Bank" },
    { key: "other", label: "Other" },
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Customer
              </ThemedText>
              <ThemedText type="h4">{customerName}</ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor() + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: getStatusColor(), textTransform: "capitalize", fontWeight: "600" }}
              >
                {transaction.status}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            {formatDateTime(transaction.date)}
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <View style={[styles.amountsCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.amountRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Total Amount
            </ThemedText>
            <ThemedText type="h3">
              {formatCurrency(transaction.totalAmount, profile.currency)}
            </ThemedText>
          </View>
          <View style={styles.amountRow}>
            <ThemedText type="body" style={{ color: AppColors.secondary }}>
              Amount Paid
            </ThemedText>
            <ThemedText type="h4" style={{ color: AppColors.secondary }}>
              {formatCurrency(transaction.amountPaid, profile.currency)}
            </ThemedText>
          </View>
          {pendingAmount > 0 ? (
            <View style={styles.amountRow}>
              <ThemedText type="body" style={{ color: AppColors.warning }}>
                Pending
              </ThemedText>
              <ThemedText type="h4" style={{ color: AppColors.warning }}>
                {formatCurrency(pendingAmount, profile.currency)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Products
        </ThemedText>
        {transaction.products.map((product, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(200 + index * 50).springify()}
          >
            <View style={[styles.productCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.productInfo}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {product.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {product.quantity} x {formatCurrency(product.unitPrice, profile.currency)}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(product.total, profile.currency)}
              </ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Payment History</ThemedText>
          {pendingAmount > 0 ? (
            <Pressable
              onPress={() => setShowPaymentForm(!showPaymentForm)}
              style={({ pressed }) => [
                styles.addPaymentButton,
                { backgroundColor: AppColors.secondary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name={showPaymentForm ? "x" : "plus"} size={16} color="#FFFFFF" />
              <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: 4 }}>
                {showPaymentForm ? "Cancel" : "Add Payment"}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {showPaymentForm ? (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.paymentForm, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.methodSelector}>
                {paymentMethods.map((method) => (
                  <Pressable
                    key={method.key}
                    onPress={() => setPaymentMethod(method.key)}
                    style={[
                      styles.methodChip,
                      {
                        backgroundColor:
                          paymentMethod === method.key
                            ? AppColors.primary
                            : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: paymentMethod === method.key ? "#FFFFFF" : theme.text,
                      }}
                    >
                      {method.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundSecondary, color: theme.text },
                ]}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder={`Amount (max ${formatCurrency(pendingAmount, profile.currency)})`}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <Pressable
                onPress={handleAddPayment}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: AppColors.secondary, opacity: pressed || isSubmitting ? 0.8 : 1 },
                ]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {isSubmitting ? "Adding..." : "Add Payment"}
                </ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {payments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="credit-card" size={32} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              No payments recorded yet
            </ThemedText>
          </View>
        ) : (
          <View style={styles.paymentsList}>
            {payments.map((payment, index) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                currency={profile.currency}
                index={index}
              />
            ))}
          </View>
        )}
      </View>

      {transaction.notes ? (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.section}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
              Notes
            </ThemedText>
            <View style={[styles.notesCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {transaction.notes}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  amountsCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
    gap: Spacing.md,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  paymentForm: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  methodSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  methodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentsList: {
    gap: Spacing.sm,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
  },
  notesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
