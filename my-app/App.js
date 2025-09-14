import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screen Components
import Account from "./Account";
import Settings from "./Settings";
import LoginScreen from "./LoginScreen";
import HomeScreen from "./HomeScreen";
import CreatePost from "./CreatePost";
import RegisterScreen from "./RegisterScreen";
import Profile from "./Profile";
import CommentsScreen from "./CommentsScreen";
import FollowList from "./FollowList";
import EditPost from "./EditPost";
import NotificationsScreen from "./NotificationsScreen";
import PostDetail from "./PostDetail";
import ActivityScreen from "./ActivityScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import OTPVerificationScreen from "./OTPVerificationScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";

// Tab Navigator
const Tab = createBottomTabNavigator();

const checkLoginStatus = async () => {
  const storedUserId = await AsyncStorage.getItem("userId");
  if (storedUserId) {
    setIsLoggedIn(true);
    setUserId(storedUserId); // เก็บ userId จาก AsyncStorage
  } else {
    setIsLoggedIn(false);
  }
};

function MainTabs({ route }) {
  const { userId } = route.params || {}; // รับ userId จาก props

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // ไม่แสดง header สำหรับทุกหน้าใน TabNavigator
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{ userId: userId || "defaultUserId" }} // ใช้ userId ที่ได้จาก AsyncStorage หรือ default value
      />
      <Tab.Screen
        name="Create"
        component={CreatePost}
        initialParams={{ userId }}
        options={{ headerShown: true }} // ตั้งค่าให้แสดง header ในหน้า CreatePost
      />
      <Tab.Screen
        name="Settings"
        component={Settings}
        options={{ headerShown: true }}
      />
    </Tab.Navigator>
  );
}

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        let iconName;
        if (route.name === "Home") iconName = "home";
        else if (route.name === "Create") iconName = "add";
        else if (route.name === "Settings") iconName = "settings";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "Create") {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              onPress={onPress}
              style={styles.middleButton}
            >
              <View style={styles.middleButtonInner}>
                <Ionicons
                  name={iconName}
                  size={45}
                  color="#fff"
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.label}>{label}</Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons name={iconName} size={26} color="#fff" />
            <Text style={styles.label}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Stack Navigator
const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (storedUserId) {
        setIsLoggedIn(true);
        setUserId(storedUserId); // Set userId from AsyncStorage
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? "MainTabs" : "Login"}>
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          initialParams={{ userId }} // ส่ง userId ไปใน route.params
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Forgot Password", headerShown: false }}
        />
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
          options={{ title: "OTP Verification", headerShown: true }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ title: "Reset Password", headerShown: true }}
        />
        <Stack.Screen
          name="Account"
          component={Account}
          initialParams={{ userId }}
          options={{
            title: "Account",
            headerStyle: {
              backgroundColor: "#1E1E1E",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="ActivityScreen"
          component={ActivityScreen}
          initialParams={{ userId }}
          options={{
            title: "Activity",
            headerStyle: {
              backgroundColor: "#1E1E1E",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Comments"
          component={CommentsScreen}
          options={{
            title: "Comments",
            headerStyle: {
              backgroundColor: "#1E1E1E",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="FollowList"
          component={FollowList}
          options={({ route }) => ({
            title:
              route.params.type === "followers" ? "Followers" : "Following",
            headerStyle: {
              backgroundColor: "#303030",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
          })}
        />
        <Stack.Screen
          name="EditPost"
          component={EditPost} // Make sure EditPost is correctly imported
          options={{ title: "Edit Post", headerShown: true }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: "Notifications", headerShown: true, 
             headerStyle: {
              backgroundColor: "#1E1E1E",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetail}
          options={{ title: "Post", headerShown: true,
             headerStyle: {
              backgroundColor: "#1E1E1E",
              shadowColor: "transparent",
              elevation: 0,
            },
            headerTintColor: "#fff",
           }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 70,
    backgroundColor: "#FF7900",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  middleButton: {
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  middleButtonInner: {
    width: 110,
    height: 100,
    borderRadius: 55,
    backgroundColor: "#FF7900",
    justifyContent: "center",
    alignItems: "center",
  },
});