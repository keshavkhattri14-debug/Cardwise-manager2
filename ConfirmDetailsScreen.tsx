import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, TextInput, Image, Pressable, Alert } from "react-native";
import { useNavigation, useRoute, NavigationProp, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/utils/storage";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

type ConfirmDetailsRouteProp = RouteProp<RootStackParamList, "ConfirmDetails">;

interface FormData {
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  businessType: string;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  index,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  index: number;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 50).springify()}
      style={styles.fieldContainer}
    >
      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.backgroundDefault, color: theme.text },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </Animated.View>
  );
}

export default function ConfirmDetailsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ConfirmDetailsRouteProp>();
  const { theme } = useTheme();
  const { extractedData, imageUri, existingCustomerId } = route.params;

  const [formData, setFormData] = useState<FormData>({
    name: extractedData.name,
    businessName: extractedData.businessName,
    mobile: extractedData.mobile,
    email: extractedData.email,
    address: extractedData.address,
    businessType: extractedData.businessType,
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter a name for this customer.");
      return;
    }

    setIsSaving(true);
    try {
      if (existingCustomerId) {
        await storage.updateCustomer(existingCustomerId, {
          ...formData,
          cardImageUri: imageUri,
        });
      } else {
        await storage.addCustomer({
          ...formData,
          cardImageUri: imageUri,
        });
      }
      navigation.navigate("MainTabs", { screen: "CustomersTab" });
    } catch (error) {
      Alert.alert("Error", "Failed to save customer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to discard the scanned card?",
      [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
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
  }, [navigation, formData, isSaving, theme]);

  return (
    <ScreenKeyboardAwareScrollView>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.imageCard, { backgroundColor: theme.backgroundDefault }]}>
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="contain" />
        </View>
      </Animated.View>

      <View style={styles.form}>
        <FormField
          label="Name *"
          value={formData.name}
          onChangeText={(text) => updateField("name", text)}
          placeholder="Enter name"
          index={0}
        />
        <FormField
          label="Business Name"
          value={formData.businessName}
          onChangeText={(text) => updateField("businessName", text)}
          placeholder="Enter business name"
          index={1}
        />
        <FormField
          label="Mobile"
          value={formData.mobile}
          onChangeText={(text) => updateField("mobile", text)}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          index={2}
        />
        <FormField
          label="Email"
          value={formData.email}
          onChangeText={(text) => updateField("email", text)}
          placeholder="Enter email address"
          keyboardType="email-address"
          index={3}
        />
        <FormField
          label="Address"
          value={formData.address}
          onChangeText={(text) => updateField("address", text)}
          placeholder="Enter physical address"
          index={4}
        />
        <FormField
          label="Business Type"
          value={formData.businessType}
          onChangeText={(text) => updateField("businessType", text)}
          placeholder="e.g., Retail, Wholesale, Services"
          index={5}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(500).springify()}>
        <Pressable
          onPress={() => navigation.navigate("Scanner")}
          style={[styles.rescanButton, { borderColor: theme.border }]}
        >
          <Feather name="refresh-cw" size={20} color={AppColors.primary} />
          <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.sm }}>
            Rescan Card
          </ThemedText>
        </Pressable>
      </Animated.View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  imageCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  fieldContainer: {},
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});
