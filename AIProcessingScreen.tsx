import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, NavigationProp, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { extractCardData } from "@/utils/aiExtraction";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

type AIProcessingRouteProp = RouteProp<RootStackParamList, "AIProcessing">;

export default function AIProcessingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<AIProcessingRouteProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { imageUri, imageBase64 } = route.params;
  const [status, setStatus] = useState("Analyzing card...");

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    const processCard = async () => {
      try {
        setStatus("Analyzing card...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setStatus("Extracting details...");
        const extractedData = await extractCardData(imageBase64);
        
        setStatus("Complete!");
        await new Promise((resolve) => setTimeout(resolve, 500));

        navigation.replace("ConfirmDetails", {
          extractedData,
          imageUri,
        });
      } catch (error) {
        console.error("Processing error:", error);
        navigation.replace("ConfirmDetails", {
          extractedData: {
            name: "",
            businessName: "",
            mobile: "",
            email: "",
            address: "",
            businessType: "",
          },
          imageUri,
        });
      }
    };

    processCard();
  }, [imageBase64, imageUri, navigation]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.delay(100)} style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="contain" />
        <LinearGradient
          colors={["transparent", theme.backgroundRoot]}
          style={styles.imageGradient}
        />
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={[styles.spinnerContainer, rotateStyle]}>
            <LinearGradient
              colors={[AppColors.primary, AppColors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.spinner}
            />
          </Animated.View>
          <ActivityIndicator size="large" color={AppColors.primary} style={styles.activityIndicator} />
        </View>

        <Animated.View entering={FadeIn.delay(300)} style={styles.statusContainer}>
          <ThemedText type="h3" style={styles.statusText}>
            {status}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Our AI is reading the business card details
          </ThemedText>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: "35%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  loaderContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  spinnerContainer: {
    position: "absolute",
    width: 100,
    height: 100,
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    top: 0,
    left: 40,
  },
  activityIndicator: {
    position: "absolute",
  },
  statusContainer: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    textAlign: "center",
  },
});
