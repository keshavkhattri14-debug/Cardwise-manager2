import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomerListScreen from "@/screens/CustomerListScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { CustomersStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export default function CustomersStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{
          title: "Customers",
        }}
      />
    </Stack.Navigator>
  );
}
