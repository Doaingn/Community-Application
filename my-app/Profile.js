import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, FlatList, Alert, StyleSheet, Linking, Image, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PostCard from "./PostCard"; 
import { MaterialCommunityIcons } from 'react-native-vector-icons';  // Import the icon library


export default function Profile({ route, navigation }) {
  const { userId } = route.params; // userId ของผู้ที่กำลังดูโปรไฟล์
  const [loggedInUserId, setLoggedInUserId] = useState(null); // เก็บ userId ของผู้ที่ล็อกอิน
  const [userData, setUserData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);  // สถานะการติดตาม
  const [userPosts, setUserPosts] = useState([]);  // เก็บโพสต์ของผู้ที่ล็อกอิน
  const [loading, setLoading] = useState(true);  // สถานะการโหลดข้อมูล
  const [isOwnProfile, setIsOwnProfile] = useState(false); // เพิ่มตัวแปรเก็บสถานะว่าเป็นโปรไฟล์ของตัวเองหรือไม่

  // ฟังก์ชันเมื่อผู้ใช้คลิกที่จำนวนผู้ติดตามหรือกำลังติดตาม
  const handleFollowStatsClick = (type) => {
    if (!userData) return;
    
    // นำทางไปยังหน้าแสดงรายชื่อผู้ติดตามหรือกำลังติดตาม
    navigation.navigate("FollowList", { 
      userId: userId,
      username: userData.username,
      type: type // 'followers' หรือ 'following'
    });
  };

// ฟังก์ชันการดึงข้อมูลโปรไฟล์และโพสต์
const fetchUserData = async () => {
  try {
    console.log('Fetching data for userId:', userId);

    // ดึง user ID ที่ล็อกอินอยู่
    const storedUserId = await AsyncStorage.getItem("userId");
    setLoggedInUserId(storedUserId);
    console.log('Logged in userId:', storedUserId);
    
    // ตรวจสอบว่าเป็นโปรไฟล์ของตัวเองหรือไม่
    const isSelfProfile = storedUserId === userId.toString();
    setIsOwnProfile(isSelfProfile);
    console.log('Is own profile:', isSelfProfile, 'storedUserId:', storedUserId, 'userId:', userId);

    // ดึงข้อมูลโปรไฟล์ของผู้ใช้
    const response = await fetch(`http://192.168.1.113:3000/users/${userId}`);
    const data = await response.json();
    console.log('Fetched user data:', data);

    // ดึงข้อมูลจำนวนผู้ติดตาม
    const followersCountResponse = await fetch(`http://192.168.1.113:3000/api/followers_count/${userId}`);
    const followersCountData = await followersCountResponse.json();
    console.log('Followers count:', followersCountData.followers_count);
    
    // ดึงข้อมูลจำนวนที่กำลังติดตาม
    const followingCountResponse = await fetch(`http://192.168.1.113:3000/api/following_count/${userId}`);
    const followingCountData = await followingCountResponse.json();
    console.log('Following count:', followingCountData.following_count);
    
    // อัปเดตข้อมูลผู้ใช้พร้อมจำนวนผู้ติดตามและกำลังติดตาม
    setUserData({
      ...data,
      followers_count: followersCountData.followers_count,
      following_count: followingCountData.following_count
    });

    // ดึงโพสต์ของผู้ใช้โดยเฉพาะจาก API endpoint
    const postsResponse = await fetch(`http://192.168.1.113:3000/posts/user/${userId}?viewerId=${storedUserId || 0}`);
    const postsData = await postsResponse.json();
    console.log('Fetched user posts:', postsData.length);
    setUserPosts(postsData);
    
    // ตรวจสอบสถานะการติดตาม (ถ้า storedUserId เป็นค่าว่างหรือ null จะไม่ทำการเช็ค)
    if (storedUserId && !isSelfProfile) {
      const followingCheckResponse = await fetch(`http://192.168.1.113:3000/api/following/${storedUserId}`);
      const followingCheckData = await followingCheckResponse.json();
      
      // ตรวจสอบว่าผู้ใช้ที่ล็อกอินอยู่กำลังติดตาม userId ที่กำลังดูอยู่หรือไม่
      const isCurrentlyFollowing = followingCheckData.some(following => following.user_id == userId);
      console.log('Following check data:', followingCheckData);
      console.log('Is following:', isCurrentlyFollowing, 'user_id:', userId);
      
      setIsFollowing(isCurrentlyFollowing);
    }
    
    setLoading(false);
  } catch (error) {
    console.error("Error fetching data:", error);
    setLoading(false);
  }
};

  // ตรวจสอบ userId ที่ล็อกอิน
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      console.log('Stored userId from AsyncStorage:', storedUserId);
      setLoggedInUserId(storedUserId);  // เก็บ userId ของผู้ที่ล็อกอิน
      
      // ตรวจสอบว่าเป็นโปรไฟล์ของตัวเองหรือไม่
      setIsOwnProfile(storedUserId === userId.toString());
    };

    checkLoggedInUser();
  }, [userId]);  // เพิ่ม userId เป็น dependency เพื่อให้ตรวจสอบทุกครั้งเมื่อ userId เปลี่ยน

  // เมื่อ loggedInUserId หรือ userId เปลี่ยน, เรียก fetchUserData ใหม่
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('UserId from route params:', userId);
        fetchUserData();
      }
    }, [userId])
  );

 // ฟังก์ชันการติดตาม/ยกเลิกการติดตาม
const toggleFollow = async () => {
  try {
    const storedUserId = await AsyncStorage.getItem("userId");
    if (!storedUserId) {
      Alert.alert("Error", "กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    const url = isFollowing
      ? "http://192.168.1.113:3000/api/unfollow"
      : "http://192.168.1.113:3000/api/follow";

    console.log(`Calling ${url} with userId: ${storedUserId}, followingId: ${userId}`);

    // เรียก API สำหรับการติดตามหรือเลิกติดตาม
    const response = await fetch(url, {
      method: isFollowing ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: storedUserId, followingId: userId }),
    });

    const responseJson = await response.json();
    console.log("API Response:", responseJson);

    // ถ้าได้รับข้อผิดพลาดจาก API เช่น 'Already following'
    if (!response.ok) {
      if (responseJson.error === "Already following this user") {
        // แจ้งเตือนว่าเราได้ติดตามผู้ใช้แล้ว
        Alert.alert("Information", "คุณกำลังติดตามผู้ใช้นี้อยู่แล้ว");
      } else {
        console.error("Error in follow API:", responseJson.error);
        Alert.alert("Error", responseJson.error || "เกิดข้อผิดพลาดบางอย่าง");
      }
      return;
    }

    // อัปเดตสถานะการติดตามทันที
    setIsFollowing(!isFollowing);
    
    // อัปเดตจำนวน followers ในข้อมูลผู้ใช้
    if (userData) {
      // อัปเดตจำนวนผู้ติดตามใหม่หลังจากกดปุ่ม Follow/Unfollow
      const newFollowersCount = userData.followers_count + (isFollowing ? -1 : 1);
      
      setUserData({
        ...userData,
        followers_count: newFollowersCount
      });
    }
    
    // ไม่ต้องเรียก fetchUserData อีกครั้ง เพราะเราอัปเดตค่า followers_count ในข้อมูลผู้ใช้แล้ว
    // และอาจทำให้เกิดการกระพริบของ UI
  } catch (error) {
    console.error("Error toggling follow:", error);
    Alert.alert("Error", "เกิดข้อผิดพลาดในการติดตาม/ยกเลิกการติดตาม");
  }
};

  const handleLike = async (postId, isLiked) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const url = isLiked
        ? "http://192.168.1.113:3000/api/unlike"
        : "http://192.168.1.113:3000/api/like";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, userId: parseInt(userId) }),
      });

      if (response.ok) {
        const updatedPosts = userPosts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                liked: !isLiked,
                like_count: post.like_count + (isLiked ? -1 : 1),
              }
            : post
        );
        setUserPosts(updatedPosts);
      } else {
        throw new Error("Like/unlike failed");
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      Alert.alert("Error", "ไม่สามารถกดไลค์หรือยกเลิกไลค์โพสต์ได้");
    }
  };

  const handleOpenMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch((err) => console.error("Failed to open map:", err));
  };

  const handleDelete = async (postId) => {
  try {
    const response = await fetch(`http://192.168.1.113:3000/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      const updatedPosts = userPosts.filter((post) => post.post_id !== postId);
      setUserPosts(updatedPosts);
    } else {
      const responseText = await response.text();
      throw new Error(`Failed to delete post: ${response.status} ${responseText}`);
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    Alert.alert("Error", "ไม่สามารถลบโพสต์ได้");
  }
};



  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {userData ? (
        <>
          {userData.avatar ? (
            <Image source={{ uri: `http://192.168.1.113:3000/${userData.avatar}` }} style={styles.profileImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={100} color="#aaa" style={styles.profileImage} />
          )}
          <Text style={styles.name}>{userData.username}</Text>
          <Text style={styles.bio}>{userData.bio}</Text>
          <View style={styles.stats}>
            <TouchableOpacity onPress={() => handleFollowStatsClick('followers')}>
              <Text style={styles.statsText}>Followers: {userData.followers_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFollowStatsClick('following')}>
              <Text style={styles.statsText}>Following: {userData.following_count || 0}</Text>
            </TouchableOpacity>
          </View>

          {/* แสดงปุ่ม Follow/Unfollow เฉพาะเมื่อไม่ใช่โปรไฟล์ของตัวเอง */}
          {!isOwnProfile && (
            <TouchableOpacity style={styles.followButton} onPress={toggleFollow}>
              <Text style={styles.followButtonText}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text>Loading...</Text>
      )}

      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.post_id.toString()}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            navigation={navigation}
            handleLike={handleLike}
            handleOpenMap={handleOpenMap}
            handleDelete={handleDelete}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
    padding: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
  },
  name: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#F58637",
  },
  bio: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 10,
    color: "#ffffff",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  statsText: {
    fontSize: 16,
    marginHorizontal: 15,
    color: "#ffffff",
  },
  followButton: {
    backgroundColor: "#FFA500",
    padding: 10,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  followButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
});