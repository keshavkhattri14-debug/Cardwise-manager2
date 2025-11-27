import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Text,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { RootStackParamList } from "@/navigation/types";
import { AppColors, Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ScannerScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchImages, setBatchImages] = useState<Array<{ uri: string; base64: string }>>([]);
  const cameraRef = useRef<CameraView>(null);
  const captureScale = useSharedValue(1);

  const captureAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const handleCapturePressIn = () => {
    captureScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handleCapturePressOut = () => {
    captureScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const processImage = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return { uri, base64 };
    } catch (error) {
      Alert.alert("Error", "Failed to process image. Please try again.");
      return null;
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        const processed = await processImage(photo.uri);
        if (processed) {
          if (isBatchMode) {
            setBatchImages((prev) => [...prev, processed]);
            Alert.alert("Success", `Scanned ${batchImages.length + 1} card(s)`, [
              { text: "Scan More", style: "default" },
              {
                text: "Process All",
                style: "destructive",
                onPress: () => handleProcessBatch([...batchImages, processed]),
              },
            ]);
          } else {
            navigation.navigate("AIProcessing", {
              imageUri: processed.uri,
              imageBase64: processed.base64,
            });
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleProcessBatch = async (images: Array<{ uri: string; base64: string }>) => {
    setIsBatchMode(false);
    setBatchImages([]);
    navigation.goBack();

    for (let i = 0; i < images.length; i++) {
      Alert.alert(`Processing Card ${i + 1} of ${images.length}`, "Extracting details...");
      navigation.navigate("AIProcessing", {
        imageUri: images[i].uri,
        imageBase64: images[i].base64,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const processed = await processImage(result.assets[0].uri);
        if (processed) {
          if (isBatchMode) {
            setBatchImages((prev) => [...prev, processed]);
          } else {
            navigation.navigate("AIProcessing", {
              imageUri: processed.uri,
              imageBase64: processed.base64,
            });
          }
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleClose = () => {
    if (isBatchMode && batchImages.length > 0) {
      Alert.alert(
        "Discard Batch?",
        `You have ${batchImages.length} scanned cards. Do you want to process them or discard?`,
        [
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
          {
            text: "Process",
            style: "default",
            onPress: () => handleProcessBatch(batchImages),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
          <Feather name="camera" size={64} color="#FFFFFF" />
          <ThemedText type="h3" style={styles.permissionText}>
            Loading camera...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Pressable
          onPress={handleClose}
          style={[styles.closeButton, { top: insets.top + Spacing.md }]}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.permissionContainer}>
          <Feather name="camera-off" size={64} color="#FFFFFF" />
          <ThemedText type="h3" style={styles.permissionText}>
            Camera Access Required
          </ThemedText>
          <ThemedText type="body" style={styles.permissionSubtext}>
            Please allow camera access to scan business cards
          </ThemedText>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.permissionButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={[AppColors.primary, AppColors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionButtonGradient}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Enable Camera
              </ThemedText>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.galleryButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF" }}>
              Or pick from gallery
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Pressable
          onPress={handleClose}
          style={[styles.closeButton, { top: insets.top + Spacing.md }]}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.permissionContainer}>
          <Feather name="smartphone" size={64} color="#FFFFFF" />
          <ThemedText type="h3" style={styles.permissionText}>
            Run in Expo Go
          </ThemedText>
          <ThemedText type="body" style={styles.permissionSubtext}>
            Camera scanning works best on mobile devices. Scan the QR code to open in Expo Go.
          </ThemedText>
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.permissionButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={[AppColors.primary, AppColors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionButtonGradient}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Pick from Gallery
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashOn ? "on" : "off"}
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={styles.topControls}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.controlButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.titleContainer}>
              <ThemedText type="h4" style={styles.title}>
                {isBatchMode ? `Batch: ${batchImages.length}` : "Scan Card"}
              </ThemedText>
              {isBatchMode ? (
                <Pressable
                  onPress={() => setIsBatchMode(false)}
                  style={({ pressed }) => [
                    styles.modeBadge,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="check" size={14} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => setFlashOn(!flashOn)}
              style={({ pressed }) => [styles.controlButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name={flashOn ? "zap" : "zap-off"} size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <ThemedText type="small" style={styles.hint}>
              {isBatchMode
                ? "Scan multiple cards. Tap check when done."
                : "Position the business card within the frame"}
            </ThemedText>
          </View>

          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => [styles.galleryPickButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="image" size={28} color="#FFFFFF" />
            </Pressable>

            <AnimatedPressable
              onPress={handleCapture}
              onPressIn={handleCapturePressIn}
              onPressOut={handleCapturePressOut}
              disabled={isCapturing}
              style={[styles.captureButton, captureAnimatedStyle]}
            >
              <View style={styles.captureButtonInner} />
            </AnimatedPressable>

            <Pressable
              onPress={() => setIsBatchMode(!isBatchMode)}
              style={({ pressed }) => [
                styles.batchButton,
                {
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: isBatchMode ? AppColors.primary : "rgba(255,255,255,0.2)",
                },
              ]}
            >
              <Feather name="layers" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  frameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  frame: {
    width: "100%",
    aspectRatio: 1.6,
    maxWidth: 340,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.md,
  },
  hint: {
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing["3xl"],
  },
  galleryPickButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  batchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  permissionText: {
    color: "#FFFFFF",
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  permissionSubtext: {
    color: "rgba(255,255,255,0.7)",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: Spacing["2xl"],
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  permissionButtonGradient: {
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
  },
  galleryButton: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
});
