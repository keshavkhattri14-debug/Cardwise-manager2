import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import { getDashboardStats } from "@/utils/analytics";
import { formatCurrency, getGreeting, getInitials } from "@/utils/format";
import { Customer, Transaction, DashboardStats } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatCard({
  title,
  value,
  icon,
  gradient,
  index,
  onPress,
}: {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  gradient?: boolean;
  index: number;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const content = (
    <>
      <View style={styles.statIconContainer}>
        <Feather
          name={icon}
          size={20}
          color={gradient ? "#FFFFFF" : AppColors.primary}
        />
      </View>
      <ThemedText
        type="h3"
        style={[
          styles.statValue,
          gradient ? { color: "#FFFFFF" } : { color: theme.text },
        ]}
      >
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        style={[
          styles.statTitle,
          gradient ? { color: "rgba(255,255,255,0.9)" } : { color: theme.textSecondary },
        ]}
      >
        {title}
      </ThemedText>
    </>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.statCard, animatedStyle]}
        disabled={!onPress}
      >
        {gradient ? (
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCardGradient}
          >
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.statCardGradient,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            {content}
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

function RecentCustomerCard({
  customer,
  index,
  onPress,
}: {
  customer: Customer;
  index: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 50).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.recentCard,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
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
        <View style={styles.recentCardContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {customer.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {customer.businessName || customer.businessType}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({ name: "", businessName: "", currency: "INR" });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    thisMonthRevenue: 0,
    pendingCollections: 0,
    topCustomer: { customer: null, amount: 0 },
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [profileData, customersData, transactionsData] = await Promise.all([
      storage.getProfile(),
      storage.getCustomers(),
      storage.getTransactions(),
    ]);
    setProfile(profileData);
    setCustomers(customersData);
    setTransactions(transactionsData);
    setStats(getDashboardStats(customersData, transactionsData));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const recentCustomers = customers.slice(0, 5);
  const greeting = getGreeting();

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={AppColors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {greeting}
          </ThemedText>
          <ThemedText type="h2">
            {profile.name || "Business Owner"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Customers"
          value={stats.totalCustomers.toString()}
          icon="users"
          gradient
          index={0}
          onPress={() => navigation.navigate("MainTabs", { screen: "CustomersTab" })}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.thisMonthRevenue, profile.currency)}
          icon="trending-up"
          index={1}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(stats.pendingCollections, profile.currency)}
          icon="clock"
          index={2}
        />
      </View>

      {stats.topCustomer.customer ? (
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Pressable
            onPress={() =>
              navigation.navigate("CustomerDetail", {
                customerId: stats.topCustomer.customer!.id,
              })
            }
            style={({ pressed }) => [
              styles.topCustomerCard,
              { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.topCustomerBadge}>
              <Feather name="award" size={16} color={AppColors.gold} />
              <ThemedText type="small" style={{ color: AppColors.gold, marginLeft: 4 }}>
                Top Customer This Month
              </ThemedText>
            </View>
            <View style={styles.topCustomerContent}>
              <LinearGradient
                colors={[AppColors.gold, "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topCustomerAvatar}
              >
                <ThemedText style={styles.avatarText}>
                  {getInitials(stats.topCustomer.customer.name)}
                </ThemedText>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {stats.topCustomer.customer.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {stats.topCustomer.customer.businessName}
                </ThemedText>
              </View>
              <ThemedText type="h4" style={{ color: AppColors.secondary }}>
                {formatCurrency(stats.topCustomer.amount, profile.currency)}
              </ThemedText>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Recent Customers</ThemedText>
          {customers.length > 5 ? (
            <Pressable
              onPress={() => navigation.navigate("MainTabs", { screen: "CustomersTab" })}
            >
              <ThemedText type="link">See All</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {recentCustomers.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}
          >
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}
            >
              No customers yet. Tap the camera button to scan your first business card!
            </ThemedText>
          </Animated.View>
        ) : (
          <View style={styles.recentList}>
            {recentCustomers.map((customer, index) => (
              <RecentCustomerCard
                key={customer.id}
                customer={customer}
                index={index}
                onPress={() =>
                  navigation.navigate("CustomerDetail", { customerId: customer.id })
                }
              />
            ))}
          </View>
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  statCardGradient: {
    padding: Spacing.lg,
    alignItems: "flex-start",
    minHeight: 120,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
  },
  topCustomerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  topCustomerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  topCustomerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  topCustomerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
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
  recentList: {
    gap: Spacing.sm,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  recentCardContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
});
