import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, NavigationProp, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/utils/storage";
import { ProductItem } from "@/types";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

type AddTransactionRouteProp = RouteProp<RootStackParamList, "AddTransaction">;

interface ProductForm {
  name: string;
  quantity: string;
  unitPrice: string;
}

function ProductInput({
  product,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  product: ProductForm;
  index: number;
  onUpdate: (field: keyof ProductForm, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).springify()}
      style={[styles.productCard, { backgroundColor: theme.backgroundDefault }]}
    >
      <View style={styles.productHeader}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Product {index + 1}
        </ThemedText>
        {canRemove ? (
          <Pressable onPress={onRemove} style={{ padding: Spacing.xs }}>
            <Feather name="x" size={18} color={AppColors.error} />
          </Pressable>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
        value={product.name}
        onChangeText={(text) => onUpdate("name", text)}
        placeholder="Product name"
        placeholderTextColor={theme.textSecondary}
      />
      <View style={styles.productRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            value={product.quantity}
            onChangeText={(text) => onUpdate("quantity", text)}
            placeholder="Qty"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1.5 }}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            value={product.unitPrice}
            onChangeText={(text) => onUpdate("unitPrice", text)}
            placeholder="Unit price"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function AddTransactionScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<AddTransactionRouteProp>();
  const { theme } = useTheme();
  const { customerId } = route.params;

  const [products, setProducts] = useState<ProductForm[]>([
    { name: "", quantity: "", unitPrice: "" },
  ]);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateProduct = (index: number, field: keyof ProductForm, value: string) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addProduct = () => {
    setProducts((prev) => [...prev, { name: "", quantity: "", unitPrice: "" }]);
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const price = parseFloat(p.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSave = async () => {
    const validProducts = products.filter(
      (p) => p.name.trim() && p.quantity && p.unitPrice
    );

    if (validProducts.length === 0) {
      Alert.alert("Required", "Please add at least one product with name, quantity, and price.");
      return;
    }

    const totalAmount = calculateTotal();
    const paid = parseFloat(amountPaid) || 0;

    if (paid > totalAmount) {
      Alert.alert("Invalid", "Amount paid cannot exceed total amount.");
      return;
    }

    setIsSaving(true);
    try {
      const productItems: ProductItem[] = validProducts.map((p) => ({
        name: p.name.trim(),
        quantity: parseFloat(p.quantity),
        unitPrice: parseFloat(p.unitPrice),
        total: parseFloat(p.quantity) * parseFloat(p.unitPrice),
      }));

      await storage.addTransaction({
        customerId,
        date: new Date().toISOString(),
        products: productItems,
        totalAmount,
        amountPaid: paid,
        status: paid >= totalAmount ? "paid" : paid > 0 ? "partial" : "pending",
        notes: notes.trim() || undefined,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleCancel} style={{ padding: Spacing.sm }}>
          <ThemedText type="body" style={{ color: theme.text }}>
            Cancel
          </ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={{ padding: Spacing.sm, opacity: isSaving ? 0.5 : 1 }}
        >
          <ThemedText type="body" style={{ color: AppColors.primary, fontWeight: "600" }}>
            {isSaving ? "Saving..." : "Save"}
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, products, amountPaid, isSaving, theme]);

  const totalAmount = calculateTotal();

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
        Products
      </ThemedText>

      <View style={styles.productsList}>
        {products.map((product, index) => (
          <ProductInput
            key={index}
            product={product}
            index={index}
            onUpdate={(field, value) => updateProduct(index, field, value)}
            onRemove={() => removeProduct(index)}
            canRemove={products.length > 1}
          />
        ))}
      </View>

      <Pressable
        onPress={addProduct}
        style={({ pressed }) => [
          styles.addProductButton,
          { borderColor: AppColors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Feather name="plus" size={20} color={AppColors.primary} />
        <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.sm }}>
          Add Product
        </ThemedText>
      </Pressable>

      <View style={[styles.totalCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Total Amount
        </ThemedText>
        <ThemedText type="h3" style={{ color: AppColors.primary }}>
          {totalAmount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
          })}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
          Amount Paid Now
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
          value={amountPaid}
          onChangeText={setAmountPaid}
          placeholder="Enter amount received"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
          Notes (Optional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.notesInput,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this transaction"
          placeholderTextColor={theme.textSecondary}
          multiline
          textAlignVertical="top"
        />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  productsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  productCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  productRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: Spacing["2xl"],
  },
  totalCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  section: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
});
