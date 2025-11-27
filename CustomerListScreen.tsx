import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList } from "react-native";
import { useFocusEffect, useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import { getCustomerStats } from "@/utils/analytics";
import { formatCurrency, getInitials } from "@/utils/format";
import { Customer, Transaction } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CustomerCard({
  customer,
  stats,
  currency,
  index,
  onPress,
}: {
  customer: Customer;
  stats: { totalPurchased: number; amountPending: number };
  currency: string;
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
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.customerCard,
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
        <View style={styles.cardContent}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {customer.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {customer.businessName || customer.businessType}
          </ThemedText>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Total
              </ThemedText>
              <ThemedText type="small" style={{ fontWeight: "600" }}>
                {formatCurrency(stats.totalPurchased, currency)}
              </ThemedText>
            </View>
            {stats.amountPending > 0 ? (
              <View style={styles.statItem}>
                <ThemedText type="caption" style={{ color: AppColors.warning }}>
                  Pending
                </ThemedText>
                <ThemedText
                  type="small"
                  style={{ fontWeight: "600", color: AppColors.warning }}
                >
                  {formatCurrency(stats.amountPending, currency)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CustomerListScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: "", businessName: "", currency: "INR" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent");

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

  const customerStats = useMemo(() => {
    const statsMap = new Map<string, { totalPurchased: number; amountPending: number }>();
    customers.forEach((c) => {
      const stats = getCustomerStats(c.id, transactions);
      statsMap.set(c.id, {
        totalPurchased: stats.totalPurchased,
        amountPending: stats.amountPending,
      });
    });
    return statsMap;
  }, [customers, transactions]);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.businessName.toLowerCase().includes(query) ||
          c.businessType.toLowerCase().includes(query)
      );
    }

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [customers, searchQuery, sortBy]);

  const renderItem = ({ item, index }: { item: Customer; index: number }) => (
    <CustomerCard
      customer={item}
      stats={customerStats.get(item.id) || { totalPurchased: 0, amountPending: 0 }}
      currency={profile.currency}
      index={index}
      onPress={() => navigation.navigate("CustomerDetail", { customerId: item.id })}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.searchContainer,
          { 
            paddingTop: headerHeight + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View
          style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search customers..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setSortBy(sortBy === "name" ? "recent" : "name")}
          style={[styles.sortButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <Feather
            name={sortBy === "name" ? "type" : "clock"}
            size={20}
            color={theme.text}
          />
        </Pressable>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing["3xl"] },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}
            >
              {searchQuery
                ? "No customers match your search"
                : "No customers yet. Scan a business card to get started!"}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  cardContent: {
    flex: 1,
  },
  cardStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing["2xl"],
  },
});
