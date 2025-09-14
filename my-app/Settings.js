import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerForPushNotificationsAsync } from './NotificationsScreen';

export default function Settings({ navigation }) {
  const [isEnabled, setIsEnabled] = useState(true);


  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('pushEnabled');
      if (saved !== null) {
        setIsEnabled(saved === 'true');
      }
    })();
  }, []);

  const toggleSwitch = async () => {
  const newValue = !isEnabled;
  setIsEnabled(newValue);
  await AsyncStorage.setItem('pushEnabled', newValue.toString());

  const userId = await AsyncStorage.getItem('userId');
  if (!userId) {
    Alert.alert('Error', 'User not logged in');
    return;
  }

  if (newValue) {
    try {
      await registerForPushNotificationsAsync(userId);
      Alert.alert('Success', 'Push notifications enabled');
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      Alert.alert('Error', 'Failed to enable push notifications');
    }
  } else {
    try {
      const response = await fetch('http://192.168.1.113:3000/api/disable-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disable push notifications');
      }

      const data = await response.json();
      console.log(data.message);
      Alert.alert('Success', data.message); // ✅ show to user
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      Alert.alert('Error', 'Failed to disable push notifications');
    }
  }
};


  // Use effect to set header options
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { marginLeft: 16 }]} // เพิ่มระยะห่างจากขอบซ้าย
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerTitle: 'Setting',
      headerTitleStyle: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
      },
      headerStyle: {
        backgroundColor: '#1E1E1E',
      },
    });
  }, [navigation]);

  const handleLogOut = async () => {
    try {
      // Remove the userId from AsyncStorage to log out the user
      await AsyncStorage.removeItem('userId');
      // Navigate the user back to the Login screen
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.menuContainer}>
        {/* Notification Switch */}
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Notification</Text>
          <Switch
            style={styles.switch}
            trackColor={{ false: "#767577", true: "#50B44D" }}
            thumbColor={isEnabled ? "#FFFFFF" : "#FFFFFF"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {/* Account */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Account')}>
          <Text style={styles.menuText}>Account</Text>
        </TouchableOpacity>

        {/* Activity */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ActivityScreen')}>
          <Text style={styles.menuText}>Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Log out */}
      <TouchableOpacity style={styles.logOutButton} onPress={handleLogOut}>
        <MaterialCommunityIcons name="exit-to-app" size={24} color="white" />
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    backgroundColor: '#404040',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    color: 'white',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  logOutButton: {
    position: 'absolute',
    left: 20,
    bottom: 90,  // เพิ่มค่า bottom เพื่อให้ปุ่มห่างจาก tabBar
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,  // เพิ่ม zIndex เพื่อให้ปุ่มอยู่เหนือ tabBar
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
});