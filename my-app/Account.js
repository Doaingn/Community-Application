import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, TextInput, Image, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Account({ navigation }) {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    bio: '',
    avatar: '', // Profile image
  });
  const [imageUri, setImageUri] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerTitle: "Account",
      headerTitleStyle: {
        fontSize: 24,
        color: "white",
        fontWeight: "bold",
      },
      headerStyle: {
        backgroundColor: "#303030",
      },
    });

    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          Alert.alert('Error', 'User ID not found');
          return;
        }

        const response = await fetch(`http://192.168.1.113:3000/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data);
        setImageUri(data.avatar ? `http://192.168.1.113:3000/${data.avatar}` : '');
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        Alert.alert('Error', `Failed to fetch user data: ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (field, value) => {
    setUserData({
      ...userData,
      [field]: value,
    });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need permission to access your photo library!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.2,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0]?.uri);
      }
    } catch (error) {
      console.error('Error in pickImage:', error);
      Alert.alert('Error', 'Failed to open image picker: ' + error.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('bio', userData.bio); // ตรวจสอบให้แน่ใจว่า bio ถูกแนบที่นี่
      formData.append('role', userData.role || 'user');

      if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop();
        const fileType = filename.split('.').pop();
        formData.append('avatar', {
          uri: imageUri,
          name: filename,
          type: `image/${fileType}`,
        });
      }

      const response = await fetch(`http://192.168.1.113:3000/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', error.message);
    }
  };

return (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.iconContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={150} color="#FFA500" />
        )}
        <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
          <Text style={styles.uploadText}>Change Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* ส่วน input ต่าง ๆ */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>UserName</Text>
        <TextInput
          style={styles.input}
          value={userData.username}
          onChangeText={(text) => handleInputChange('username', text)}
          placeholder="Enter your username"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={userData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="Enter your email"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={userData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          placeholder="Enter your password"
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          value={userData.bio}
          onChangeText={(text) => handleInputChange('bio', text)}
          placeholder="Enter your bio"
          multiline
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
        <Text style={styles.buttonText}>Update</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  uploadButton: {
    marginTop: 10,
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
  },
  uploadText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#b2b2b2',
    marginBottom: 5,
  },
  input: {
    height: 50,
    backgroundColor: '#404040',
    color: 'white',
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFA500',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContent: {
  paddingBottom: 30,
},
});
