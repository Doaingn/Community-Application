import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';


export default function FollowList({ route, navigation }) {
  const { userId, username, type } = route.params; // type คือ 'followers' หรือ 'following'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลผู้ติดตามหรือกำลังติดตาม ขึ้นอยู่กับ type
    const fetchUsers = async () => {
      try {
        const endpoint = type === 'followers' 
          ? `http://192.168.1.113:3000/api/followers/${userId}`
          : `http://192.168.1.113:3000/api/following/${userId}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log(`Fetched ${type} data:`, data);
        setUsers(data);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  // ไปที่หน้าโปรไฟล์ของผู้ใช้ที่เลือก
  const navigateToProfile = (userId) => {
    navigation.navigate('Profile', { userId });
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <Text style={styles.noUserText}>
          {type === 'followers' ? 'No followers' : 'Not following anyone'}
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => navigateToProfile(item.user_id)}
            >
              <Image
                source={{ uri: `http://192.168.1.113:3000/${item.avatar}` }}
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  username: {
    fontSize: 17,
    color: "#ffffff",
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: "#ffffff",
  },
  noUserText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: "#ffffff",
  },
});