import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Image, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

export default function HomeHeader({ searchQuery, handleSearch }) {
  const navigation = useNavigation();
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userId, setUserId] = useState(null); // Correctly declare setUserId

  const goToProfile = () => {
    navigation.navigate("Profile", { userId }); // Send userId to Profile screen
  };
  const goToNotifications = () => {
    navigation.navigate("Notifications", { userId });
  };

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    setUserId(userId); // เก็บ userId จาก AsyncStorage
    if (userId) {
      const response = await fetch(`http://192.168.1.113:3000/users/${userId}`);

      // ตรวจสอบสถานะการตอบกลับจาก API
      if (!response.ok) {
        const errorMessage = `Failed to fetch user data. Status: ${response.status}`;
        console.error(errorMessage);
        Alert.alert("Error", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUserProfileImage(
        data.avatar ? `http://192.168.1.113:3000/${data.avatar}` : ""
      );
    }
  } catch (error) {
    console.error("Error fetching profile image:", error);
    Alert.alert("Error", `ไม่สามารถดึงข้อมูลโปรไฟล์: ${error.message}`);
  }
};


  // Use useFocusEffect to fetch user profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile(); // Fetch user profile data when the screen is focused
    }, [])
  );

  return (
    <View style={styles.headerContainer}>
      <TextInput
      
        style={styles.searchInput}
        placeholder="Search by Topic"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <TouchableOpacity
        style={styles.iconButton}
        onPress={goToNotifications} // เมื่อกดจะไปที่หน้าแจ้งเตือน
      >
        <MaterialCommunityIcons name="bell-outline" size={26} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={goToProfile}
        style={styles.profileButton}
        accessibilityRole="button"
        accessibilityLabel="Go to profile"
      >
        {userProfileImage ? (
          <Image
            source={{ uri: userProfileImage }}
            style={styles.profileImage}
          />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={30} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: StatusBar.currentHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    flex: 1,
    height: 40, // ลดลงจาก 40
    backgroundColor: "#4B4B4B",
    borderRadius: 20,
    paddingLeft: 10,
    color: "white",
    fontSize: 14,
  },
  iconButton: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  profileButton: {
    marginLeft: 10,
    borderRadius: 50,
    padding: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 50,
  },
});