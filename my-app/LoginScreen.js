import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ForgotPasswordScreen from "./ForgotPasswordScreen";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if the user is already logged in when the component mounts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          // User is logged in, navigate to the main tabs
          navigation.navigate("MainTabs", { userId });
        }
      } catch (error) {
        console.error("Error checking login status", error);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.113:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Login Successful", `Welcome ${data.user.username}!`);
        const { user } = data;

        // ตรวจสอบข้อมูลที่ได้รับจาก server
        console.log("User Data:", data); // เพิ่มการ log ข้อมูลที่ได้รับจาก server

        // ตรวจสอบว่า user.user_id มีค่า
        if (user && user.user_id) {
          // Save userId to AsyncStorage
          await AsyncStorage.setItem("userId", user.user_id.toString());

          // ส่ง userId ไปยังหน้าถัดไป
          navigation.navigate("MainTabs", { userId: user.user_id });
        } else {
          Alert.alert("Error", "User ID is missing.");
        }
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An error occurred while logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("./assets/logo.png")} style={styles.logo} />

      <View style={styles.textContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.normalText}>
            {loading ? "Logging in..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("RegisterScreen")}
        >
          <Text style={styles.registerText}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.registerText}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F58637",
  },
  logo: {
    width: 250,
    height: 250,
    marginTop: 50,
    resizeMode: "contain",
  },
  textContainer: {
    alignSelf: "flex-start",
    marginLeft: 50,
  },
  input: {
    height: 45,
    width: 310,
    marginVertical: 5,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  button: {
    height: 45,
    width: 310,
    marginTop: 10,
    borderRadius: 7,
    backgroundColor: "#75AF2F",
    alignItems: "center",
    justifyContent: "center",
  },
  normalText: {
    fontSize: 16,
    color: "white",
  },
  registerButton: {
    marginTop: 15,
    alignItems: "center",
  },
  registerText: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});