import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ScannerScreen from "@/screens/ScannerScreen";
import AIProcessingScreen from "@/screens/AIProcessingScreen";
import ConfirmDetailsScreen from "@/screens/ConfirmDetailsScreen";
import CustomerDetailScreen from "@/screens/CustomerDetailScreen";
import EditCustomerScreen from "@/screens/EditCustomerScreen";
import AddTransactionScreen from "@/screens/AddTransactionScreen";
import TransactionDetailScreen from "@/screens/TransactionDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { RootStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIProcessing"
        component={AIProcessingScreen}
        options={{
          presentation: "modal",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ConfirmDetails"
        component={ConfirmDetailsScreen}
        options={{
          presentation: "modal",
          title: "Confirm Details",
        }}
      />
      <Stack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={{
          title: "Customer",
        }}
      />
      <Stack.Screen
        name="EditCustomer"
        component={EditCustomerScreen}
        options={{
          presentation: "modal",
          title: "Edit Customer",
        }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: "modal",
          title: "Add Transaction",
        }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          title: "Transaction",
        }}
      />
    </Stack.Navigator>
  );
}
