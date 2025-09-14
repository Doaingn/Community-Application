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

export default function ResetPasswordScreen({ navigation, route }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { email, resetToken } = route.params;

  const validatePassword = () => {
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    const passwordRegex = /^[A-Za-z0-9@#$%^&*()_!+\-={}\/:[\]~.]+$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "Password can only contain letters, numbers, and special characters: @ # $ % ^ & * ( ) _ ! + – = { } \\ / : [ ] ~ ."
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);

    try {
      const response = await fetch("http://192.168.1.113:3000/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          resetToken: resetToken,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Your password has been reset successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to login screen and clear navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
          },
        ]);
      } else {
        if (data.error === "Invalid or expired reset token") {
          Alert.alert(
            "Error",
            "Reset session has expired. Please start the password reset process again.",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("ForgotPassword"),
              },
            ]
          );
        } else {
          Alert.alert(
            "Error",
            data.error || "Failed to reset password. Please try again."
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
        <Text style={styles.titleText}>Reset Password</Text>
        <Text style={styles.descriptionText}>
          Create a new password for your account. Make sure it's strong and
          secure.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeText}>
              {showConfirmPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementTitle}>Password Requirements:</Text>
          <Text style={styles.requirementText}>
            • At least 6 characters long
          </Text>
          <Text style={styles.requirementText}>
            • Letters, numbers, and special characters only
          </Text>
          <Text style={styles.requirementText}>
            • Special characters: @ # $ % ^ & * ( ) _ ! + – = {} \ / : [ ] ~ .
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.normalText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backText}>Back to OTP</Text>
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
  passwordText: {
    fontSize: 16,
    color: "#808080",
    marginBottom: 10,
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
  inputContainer: {
    position: "relative",
    marginVertical: 5,
  },
  input: {
    height: 45,
    width: 310,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.8,
    paddingHorizontal: 10,
    paddingRight: 45,
    fontSize: 16,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: 12,
    padding: 5,
  },
  eyeText: {
    fontSize: 16,
    color: "#808080",
  },
  passwordRequirements: {
    marginTop: 15,
    marginBottom: 10,
    width: 310,
  },
  requirementTitle: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 12,
    color: "white",
    opacity: 0.9,
    marginBottom: 2,
    lineHeight: 16,
  },
  button: {
    height: 45,
    width: 310,
    marginTop: 20,
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
  backButton: {
    marginTop: 15,
    alignItems: "center",
  },
  backText: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});