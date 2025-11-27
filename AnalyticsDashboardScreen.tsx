import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, Dimensions, ScrollView, Alert } from "react-native";
import { useFocusEffect, useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, PieChart } from "react-native-chart-kit";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import {
  getMonthlyRankings,
  getRevenueChartData,
  getPaymentStatusData,
  getTopProducts,
} from "@/utils/analytics";
import { exportCustomersToCSV, exportTransactionsToCSV, generateReportSummary } from "@/utils/export";
import { formatCurrency } from "@/utils/format";
import { Customer, Transaction, RankedCustomer } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

const screenWidth = Dimensions.get("window").width;

type Period = "week" | "month" | "quarter" | "year";

function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: Period;
  onSelect: (period: Period) => void;
}) {
  const { theme } = useTheme();
  const periods: Period[] = ["week", "month", "quarter", "year"];

  return (
    <View style={styles.periodContainer}>
      {periods.map((period) => (
        <Pressable
          key={period}
          onPress={() => onSelect(period)}
          style={[
            styles.periodChip,
            {
              backgroundColor:
                selected === period ? AppColors.primary : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={{
              color: selected === period ? "#FFFFFF" : theme.text,
              textTransform: "capitalize",
            }}
          >
            {period}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function RankingCard({
  item,
  currency,
  index,
  onPress,
}: {
  item: RankedCustomer;
  currency: string;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  const getMedalColor = () => {
    switch (item.rank) {
      case 1:
        return AppColors.gold;
      case 2:
        return AppColors.silver;
      case 3:
        return AppColors.bronze;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.rankingCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: item.rank <= 3 ? getMedalColor() + "20" : theme.backgroundSecondary },
          ]}
        >
          {item.rank <= 3 ? (
            <Feather name="award" size={16} color={getMedalColor()} />
          ) : (
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              {item.rank}
            </ThemedText>
          )}
        </View>
        <View style={styles.rankingContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.customer.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.transactionCount} transactions
          </ThemedText>
        </View>
        <ThemedText type="body" style={{ fontWeight: "700", color: AppColors.secondary }}>
          {formatCurrency(item.totalAmount, currency)}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function AnalyticsDashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const [period, setPeriod] = useState<Period>("month");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: "", businessName: "", currency: "INR" });
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    const [customersData, transactionsData, profileData] = await Promise.all([
      storage.getCustomers(),
      storage.getTransactions(),
      storage.getProfile(),
    ]);
    setCustomers(customersData);
    setTransactions(transactionsData);
    setProfile(profileData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDateRange = () => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const rankings = getMonthlyRankings(customers, transactions).slice(0, 10);
  const revenueData = getRevenueChartData(transactions, 6, startDate, endDate);
  const paymentStatus = getPaymentStatusData(transactions, startDate, endDate);
  const topProducts = getTopProducts(transactions, 5, startDate, endDate);

  const chartConfig = {
    backgroundGradientFrom: theme.backgroundDefault,
    backgroundGradientTo: theme.backgroundDefault,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: () => theme.textSecondary,
    propsForLabels: {
      fontSize: 10,
    },
  };

  const pieData = [
    {
      name: "Collected",
      population: paymentStatus.collected || 1,
      color: AppColors.secondary,
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
    {
      name: "Pending",
      population: paymentStatus.pending || 1,
      color: AppColors.warning,
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
  ];

  const handleExport = async (type: "customers" | "transactions") => {
    setIsExporting(true);
    try {
      if (type === "customers") {
        await exportCustomersToCSV(customers, transactions, profile);
      } else {
        await exportTransactionsToCSV(transactions, customers, profile);
      }
      Alert.alert("Success", "Data exported successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to export ${type}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShowReport = async () => {
    const report = generateReportSummary(customers, transactions, profile);
    Alert.alert("Business Report", report);
  };

  return (
    <ScreenScrollView>
      <PeriodSelector selected={period} onSelect={setPeriod} />

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.chartCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
            Revenue Trend
          </ThemedText>
          {revenueData.data.some((d) => d > 0) ? (
            <LineChart
              data={{
                labels: revenueData.labels,
                datasets: [{ data: revenueData.data.map((d) => d || 0) }],
              }}
              width={screenWidth - Spacing.xl * 2 - Spacing.lg * 2}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              withDots={true}
              withShadow={false}
            />
          ) : (
            <View style={styles.noDataChart}>
              <Feather name="bar-chart-2" size={40} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                No revenue data yet
              </ThemedText>
            </View>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={[styles.chartCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
            Payment Status
          </ThemedText>
          {paymentStatus.collected > 0 || paymentStatus.pending > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - Spacing.xl * 2 - Spacing.lg * 2}
              height={160}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.noDataChart}>
              <Feather name="pie-chart" size={40} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                No payment data yet
              </ThemedText>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.exportSection}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Export Data
        </ThemedText>
        <View style={styles.exportButtonsRow}>
          <Pressable
            onPress={() => handleExport("customers")}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.exportButton,
              { backgroundColor: AppColors.primary, opacity: pressed || isExporting ? 0.8 : 1 },
            ]}
          >
            <Feather name="download" size={18} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
              Customers
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleExport("transactions")}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.exportButton,
              { backgroundColor: AppColors.primary, opacity: pressed || isExporting ? 0.8 : 1 },
            ]}
          >
            <Feather name="download" size={18} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
              Transactions
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleShowReport}
            style={({ pressed }) => [
              styles.exportButton,
              { backgroundColor: AppColors.secondary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="file-text" size={18} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
              Report
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Top 10 Customers This Month
        </ThemedText>
        {rankings.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="users" size={40} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No customer rankings yet
            </ThemedText>
          </View>
        ) : (
          <View style={styles.rankingList}>
            {rankings.map((item, index) => (
              <RankingCard
                key={item.customer.id}
                item={item}
                currency={profile.currency}
                index={index}
                onPress={() =>
                  navigation.navigate("CustomerDetail", { customerId: item.customer.id })
                }
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Top Products
        </ThemedText>
        {topProducts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="package" size={40} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              No product data yet
            </ThemedText>
          </View>
        ) : (
          <View style={styles.productList}>
            {topProducts.map((product, index) => (
              <Animated.View
                key={product.name}
                entering={FadeInDown.delay(300 + index * 50).springify()}
              >
                <View
                  style={[styles.productCard, { backgroundColor: theme.backgroundDefault }]}
                >
                  <View style={styles.productInfo}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {product.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {product.quantity} units sold
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={{ fontWeight: "600", color: AppColors.primary }}>
                    {formatCurrency(product.revenue, profile.currency)}
                  </ThemedText>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  periodContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  periodChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  chart: {
    borderRadius: BorderRadius.md,
    marginLeft: -Spacing.lg,
  },
  noDataChart: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  exportSection: {
    marginBottom: Spacing["2xl"],
  },
  exportButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  rankingList: {
    gap: Spacing.sm,
  },
  rankingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingContent: {
    flex: 1,
  },
  productList: {
    gap: Spacing.sm,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  productInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
});
