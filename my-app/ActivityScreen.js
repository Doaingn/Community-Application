import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeHeader from "./HomeHeader";
import { Linking } from "react-native";
import PostCard from "./PostCard";

export default function ActivityScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivityPosts = async () => {
  setLoading(true);
  try {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      Alert.alert("Error", "กรุณาเข้าสู่ระบบก่อนใช้งาน");
      setLoading(false);
      return;
    }

    const response = await fetch(`http://192.168.1.113:3000/api/posts/activity/${userId}`);
    if (response.ok) {
      const data = await response.json();
      setPosts(data);
      setFilteredPosts(data);
    } else {
      throw new Error("Failed to fetch activity posts");
    }
  } catch (error) {
    console.error("Error fetching activity posts:", error);
    Alert.alert("Error", "ไม่สามารถดึงโพสต์กิจกรรมได้");
  } finally {
    setLoading(false);
  }
};


  useFocusEffect(
    useCallback(() => {
      fetchActivityPosts();
    }, [])
  );


  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter((post) =>
        post.topic.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const url = isLiked
        ? "http://192.168.1.113:3000/api/unlike"
        : "http://192.168.1.113:3000/api/like";

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: parseInt(userId) }),
      });

      if (response.ok) {
        const updatedPosts = posts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                liked: !isLiked,
                like_count: post.like_count + (isLiked ? -1 : 1),
              }
            : post
        );
        setPosts(updatedPosts);
        setFilteredPosts(
          searchQuery === ""
            ? updatedPosts
            : updatedPosts.filter((post) =>
                post.topic.toLowerCase().includes(searchQuery.toLowerCase())
              )
        );
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

  const handleDeletePost = (postId) => {
    fetch(`http://192.168.1.113:3000/api/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => {
        const updatedPosts = posts.filter((post) => post.post_id !== postId);
        setPosts(updatedPosts);
        setFilteredPosts(updatedPosts);
      })
      .catch((error) => {
        console.error("Error deleting post:", error);
        Alert.alert("Error", "ไม่สามารถลบโพสต์ได้");
      });
  };

  return (
  <View style={styles.container}>
    {/* ลบ HomeHeader ออก */}
    <FlatList
      data={filteredPosts}
      renderItem={({ item }) => (
        <PostCard
          item={item}
          navigation={navigation}
          handleLike={handleLike}
          handleOpenMap={handleOpenMap}
          handleDelete={handleDeletePost}
        />
      )}
      keyExtractor={(item) => item.post_id.toString()}
      refreshing={loading}
      onRefresh={fetchActivityPosts}
      style={styles.list}
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
  list: {
    marginTop: 10,
  },
});