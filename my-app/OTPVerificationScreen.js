import React, { useState, useRef, useEffect } from "react";
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

export default function OTPVerificationScreen({ navigation, route }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 นาที
  const inputs = useRef([]);
  const { email } = route.params;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.113:3000/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // OTP ถูกต้อง
        Alert.alert("Success", "OTP verified successfully!", [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("ResetPassword", {
                email: email,
                resetToken: data.resetToken,
              }),
          },
        ]);
      } else {
        if (data.error === "Invalid or expired OTP") {
          Alert.alert(
            "Error",
            "Invalid or expired OTP code. Please try again."
          );
        } else {
          Alert.alert(
            "Error",
            data.error || "Verification failed. Please try again."
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

  const handleResendOTP = async () => {
    if (timer > 0) return;

    setResendLoading(true);

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
        Alert.alert("Success", "OTP code has been resent to your email");
        setTimer(300); // Reset timer
        setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
      } else {
        Alert.alert("Error", data.error || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("Network Error", "Unable to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("./assets/logo.png")} style={styles.logo} />

      <View style={styles.textContainer}>
        <Text style={styles.titleText}>Enter OTP Code</Text>
        <Text style={styles.descriptionText}>
          We've sent a 6-digit verification code to {email}
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              editable={!loading && !resendLoading}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {timer > 0 ? `Time remaining: ${formatTime(timer)}` : "OTP expired"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading || resendLoading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.normalText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resendButton,
            (timer > 0 || resendLoading) && styles.resendButtonDisabled,
          ]}
          onPress={handleResendOTP}
          disabled={timer > 0 || loading || resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color="#75AF2F" size="small" />
          ) : (
            <Text
              style={[
                styles.resendText,
                timer > 0 && styles.resendTextDisabled,
              ]}
            >
              Resend OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading || resendLoading}
        >
          <Text style={styles.backText}>Back to Email</Text>
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
    marginBottom: 30,
    width: 310,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: 310,
  },
  otpInput: {
    height: 50,
    width: 45,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.9,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
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
  resendButton: {
    marginTop: 15,
    alignItems: "center",
    paddingVertical: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#75AF2F",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  resendTextDisabled: {
    color: "#A5A5A5",
  },
  backButton: {
    marginTop: 10,
    alignItems: "center",
  },
  backText: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});