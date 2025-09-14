import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "./LoginScreen";

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    const { email, username, password, confirmPassword } = form;

    if (!email || !username || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert(
        "Error",
        "Username must be 3-20 characters long and can only contain letters, numbers, underscores (_) and dots (.)"
      );
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    const passwordRegex = /^[A-Za-z0-9@#$%^&*()_!+\-={}\/:[\]~.]+$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error",
        "Password can only contain letters, numbers, and special characters: @ # $ % ^ & * ( ) _ ! + – = { } \\ / : [ ] ~ ."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);
      formData.append("role", "member");

      const imageToUpload = imageUri
        ? imageUri
        : require("./assets/deprofile.png");

      if (imageUri) {
        const uriParts = imageUri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("avatar", {
          uri: imageUri,
          name: `avatar-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
      } else {
        // You can choose to not send avatar if backend handles default,
        // or send a default image URI if needed.
        console.log("No image selected, default profile image will be used.");
      }

      const response = await fetch("http://192.168.1.113:3000/api/register", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.log("Non-JSON response received:", await response.text());
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (response.status === 201) {
        if (response.status === 201) {
          navigation.replace("Login");
        }
      } else if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.error === "email_exists") {
          Alert.alert("Error", "Your email is already in use!");
        } else if (errorData.error === "username_exists") {
          Alert.alert("Error", "Your username is already in use!");
        }
      } else if (!response.ok) {
        Alert.alert("Error", "Registration failed. Please try again.");
      } else {
        Alert.alert(
          "Error",
          data.message || "Registration failed. Please try again."
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "We need permission to access your photo library!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.2,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0]?.uri);
      }
    } catch (error) {
      console.error("Error in pickImage:", error);
      Alert.alert("Error", "Failed to open image picker: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          style={styles.image}
          source={
            imageUri ? { uri: imageUri } : require("./assets/deprofile.png")
          }
        />
      </TouchableOpacity>

      <Text style={styles.imageFormatText}>
        Supported formats: PNG, JPEG, JPG
      </Text>

      {imageUri && (
        <TouchableOpacity onPress={() => setImageUri(null)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      )}

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          onChangeText={(text) => handleChange("email", text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          onChangeText={(text) => handleChange("username", text)}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            onChangeText={(text) => handleChange("password", text)}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
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
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.normalText}>
            {loading ? "Processing..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.registerText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F58637",
    paddingHorizontal: 20,
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  normalText: {
    fontSize: 16,
    color: "white",
  },
  input: {
    width: "100%",
    height: 45,
    marginVertical: 5,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    borderRadius: 7,
    backgroundColor: "white",
    opacity: 0.8,
  },
  passwordInput: {
    flex: 1,
    height: 45,
    paddingHorizontal: 10,
  },
  eyeButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: 16,
    color: "#808080",
  },
  button: {
    width: "100%",
    height: 45,
    marginTop: 10,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#75AF2F",
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    resizeMode: "cover",
  },
  imageFormatText: {
    fontSize: 12,
    color: "white",
    marginTop: 5,
    opacity: 0.8,
  },
  removeText: {
    fontSize: 16,
    margin: 5,
    marginTop: 10,
    color: "white",
  },
  registerText: {
    marginTop: 15,
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  passwordRequirements: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 7,
    marginVertical: 10,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 12,
    color: "white",
    opacity: 0.9,
    marginBottom: 2,
  },
});