import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AnalyticsDashboardScreen from "@/screens/AnalyticsDashboardScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { AnalyticsStackParamList } from "@/navigation/types";

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export default function AnalyticsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="AnalyticsDashboard"
        component={AnalyticsDashboardScreen}
        options={{
          title: "Analytics",
        }}
      />
    </Stack.Navigator>
  );
}
