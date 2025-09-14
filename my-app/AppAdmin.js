import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "./DashboardScreen";
import ReportScreen from "./ReportScreen";
import ForumScreen from "./ForumScreen";
import UserScreen from "./UserScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{ title: "Report List" }}
        />
        <Stack.Screen
          name="Forum"
          component={ForumScreen}
          options={{ title: "Forum" }}
        />

        <Stack.Screen
          name="User"
          component={UserScreen}
          options={{ title: "User List" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
