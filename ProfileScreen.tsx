import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, TextInput, Alert, Switch } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage, UserProfile } from "@/utils/storage";
import { getInitials } from "@/utils/format";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  isNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermissions,
} from "@/utils/notifications";

function SettingsItem({
  icon,
  title,
  value,
  onPress,
  index,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  index: number;
}) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).springify()}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.settingsItem,
          { backgroundColor: theme.backgroundDefault, opacity: pressed && onPress ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.settingsIcon, { backgroundColor: AppColors.primary + "20" }]}>
          <Feather name={icon} size={20} color={AppColors.primary} />
        </View>
        <View style={styles.settingsContent}>
          <ThemedText type="body">{title}</ThemedText>
          {value ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {value}
            </ThemedText>
          ) : null}
        </View>
        {onPress ? (
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    businessName: "",
    currency: "INR",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadProfile = useCallback(async () => {
    const [data, notifEnabled] = await Promise.all([
      storage.getProfile(),
      isNotificationsEnabled(),
    ]);
    setProfile(data);
    setEditedProfile(data);
    setNotificationsEnabled(notifEnabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = async () => {
    await storage.saveProfile(editedProfile);
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const currencies = ["INR", "USD", "EUR", "GBP"];

  const handleCurrencyChange = () => {
    Alert.alert(
      "Select Currency",
      "Choose your preferred currency",
      currencies.map((curr) => ({
        text: curr,
        onPress: async () => {
          const newProfile = { ...profile, currency: curr };
          await storage.saveProfile(newProfile);
          setProfile(newProfile);
          setEditedProfile(newProfile);
        },
      }))
    );
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await setNotificationsEnabled(true);
        setNotificationsEnabled(true);
        Alert.alert("Success", "Notifications enabled. You'll receive alerts for pending payments.");
      } else {
        Alert.alert("Permission Denied", "Please enable notifications in settings to receive alerts.");
      }
    } else {
      await setNotificationsEnabled(false);
      setNotificationsEnabled(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            {profile.name ? (
              <ThemedText style={styles.avatarText}>
                {getInitials(profile.name)}
              </ThemedText>
            ) : (
              <Feather name="user" size={32} color="#FFFFFF" />
            )}
          </LinearGradient>

          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Your Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  value={editedProfile.name}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, name: text })
                  }
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Business Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  value={editedProfile.businessName}
                  onChangeText={(text) =>
                    setEditedProfile({ ...editedProfile, businessName: text })
                  }
                  placeholder="Enter your business name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={handleCancel}
                  style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText type="body">Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.button, { backgroundColor: AppColors.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                    Save
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
                {profile.name || "Set Your Name"}
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {profile.businessName || "Set Business Name"}
              </ThemedText>
              <Pressable
                onPress={() => setIsEditing(true)}
                style={[styles.editButton, { backgroundColor: AppColors.primary + "20" }]}
              >
                <Feather name="edit-2" size={16} color={AppColors.primary} />
                <ThemedText type="small" style={{ color: AppColors.primary, marginLeft: 6 }}>
                  Edit Profile
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Settings
        </ThemedText>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="dollar-sign"
            title="Currency"
            value={profile.currency}
            onPress={handleCurrencyChange}
            index={0}
          />
          <SettingsItem
            icon="bell"
            title="Notifications"
            value="Enabled"
            index={1}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          Data
        </ThemedText>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="download"
            title="Export Data"
            value="Coming soon"
            index={2}
          />
          <SettingsItem
            icon="upload-cloud"
            title="Backup"
            value="Coming soon"
            index={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
          About
        </ThemedText>
        <View style={styles.settingsList}>
          <SettingsItem
            icon="info"
            title="App Version"
            value="1.0.0"
            index={4}
          />
          <SettingsItem
            icon="help-circle"
            title="Help & Support"
            index={5}
          />
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  editForm: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  settingsList: {
    gap: Spacing.sm,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
  },
});
