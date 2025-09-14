import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    // ตรวจสอบว่ากรอก email หรือไม่
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // ตรวจสอบรูปแบบ email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.113:3000/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // สำเร็จ - ส่ง OTP แล้ว
        Alert.alert(
          "OTP Sent",
          "A 6-digit OTP code has been sent to your email address. Please check your inbox.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("OTPVerification", {
                  email: email.trim().toLowerCase(),
                }),
            },
          ]
        );
      } else {
        // มี error
        if (data.error === "This E-mail does not exist") {
          Alert.alert("Error", "This E-mail does not exist");
        } else {
          Alert.alert(
            "Error",
            data.error || "Something went wrong. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("./assets/logo.png")} style={styles.logo} />

      <View style={styles.textContainer}>
        <Text style={styles.titleText}>Forgot Password</Text>
        <Text style={styles.descriptionText}>
          Enter your email address and we'll send you a 6-digit OTP code to
          reset your password.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.normalText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.registerText}>Back to Login</Text>
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
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "white",
    marginBottom: 20,
    width: 310,
    lineHeight: 20,
  },
  input: {
    height: 45,
    width: 310,
    marginVertical: 5,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.8,
    paddingHorizontal: 10,
    fontSize: 16,
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
  buttonDisabled: {
    backgroundColor: "#A5A5A5",
  },
  normalText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
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