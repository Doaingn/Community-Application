import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, FlatList, Alert, StyleSheet, Linking, ActivityIndicator } from "react-native";
import { Accelerometer } from "expo-sensors";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import HomeHeader from "./HomeHeader";
import PostCard from "./PostCard";

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [loading, setLoading] = useState(false);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const [lastShakeTime, setLastShakeTime] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "Please log in before proceeding");
        setLoading(false);
        return;
      }

      const response = await fetch(`http://192.168.1.113:3000/posts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        // Filter immediately after receiving data
        setFilteredPosts(getFilteredPosts(data, searchQuery, selectedCategoryId));
      } else {
        throw new Error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  // Update the applyFilters function for better clarity
  const getFilteredPosts = useCallback((allPosts, query, categoryId) => {
    return allPosts.filter((post) => {
      // Search condition based on query
      const matchesQuery = query === "" || 
        post.topic.toLowerCase().includes(query.toLowerCase());
      
      // Filter condition based on category
      const matchesCategory = categoryId === "all" || 
        post.category_id === categoryId;
      
      // Must match both conditions
      return matchesQuery && matchesCategory;
    });
  }, []);

  // Use useFocusEffect to fetch data when entering this page
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
      return () => {};
    }, [])
  );

  // Set up Accelerometer (Shake to refresh)
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      const deltaX = Math.abs(x - lastAcceleration.current.x);
      const deltaY = Math.abs(y - lastAcceleration.current.y);
      const deltaZ = Math.abs(z - lastAcceleration.current.z);
      const delta = deltaX + deltaY + deltaZ;

      if (delta > 1.3 && now - lastShakeTime > 1000) {
        setLastShakeTime(now);
        fetchPosts();
      }

      lastAcceleration.current = { x, y, z };
    });

    return () => subscription.remove();
  }, [lastShakeTime]);

  // Update filteredPosts whenever posts, searchQuery, or selectedCategoryId change
  useEffect(() => {
    const filtered = getFilteredPosts(posts, searchQuery, selectedCategoryId);
    setFilteredPosts(filtered);
  }, [posts, searchQuery, selectedCategoryId, getFilteredPosts]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Set up category filter
  const filterByCategory = (categoryId) => {
    console.log("Filtering by category:", categoryId);
    setSelectedCategoryId(categoryId);
  };

  const handleLike = async (postId, isLiked) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }

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
      } else {
        throw new Error("Like/unlike failed");
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      Alert.alert("Error", "Failed to like/unlike post");
    }
  };

  const handleOpenMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open map:", err)
    );
  };

  const handleDeletePost = (postId) => {
    fetch(`http://192.168.1.113:3000/api/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedPosts = posts.filter(post => post.post_id !== postId);
        setPosts(updatedPosts);
      })
      .catch((error) => {
        console.error("Error deleting post:", error);
        Alert.alert("Error", "Failed to delete post");
      });
  };

  const handleReport = async (postId, userId, reason) => {
    try {
      const response = await fetch('http://192.168.1.113:3000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, reason }),
      });

      if (response.ok) {
        Alert.alert("Success", "Post has been reported");
      } else {
        throw new Error("Failed to report post");
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      Alert.alert("Error", "Failed to report post");
    }
  };

  // Create category data for Picker
  const categories = [
    { id: "all", name: "ALL" },
    { id: 1, name: "Education" },
    { id: 2, name: "Entertainment" },
    { id: 3, name: "Sports" },
    { id: 4, name: "Food & Drink" },
    { id: 5, name: "Finance" },
    { id: 6, name: "Music" },
    { id: 7, name: "Fashion" },
    { id: 8, name: "Business" },
    { id: 9, name: "Science" },
    { id: 10, name: "Art & Culture" }
  ];

  return (
    <View style={styles.container}>
      <HomeHeader searchQuery={searchQuery} handleSearch={handleSearch} />

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Category:</Text>
        <View style={styles.dropdownContainer}>
          <Picker
  selectedValue={selectedCategoryId}
  style={styles.picker}
  itemStyle={{ color: 'white' }}  // สีของแต่ละ item ในดรอปดาว
  dropdownIconColor="white"
  onValueChange={(itemValue) => filterByCategory(itemValue)}
  mode="dropdown"
>
  {categories.map((category) => (
    <Picker.Item 
      key={category.id} 
      label={category.name} 
      value={category.id} 
      color="black" // สำรองไว้ (บาง platform ใช้ตัวนี้)
    />
  ))}
</Picker>
        </View>
      </View>

      {loading && filteredPosts.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#64B5F6" />
          <Text style={styles.loaderText}>Loading data...</Text>
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts match your criteria</Text>
          <Text style={styles.emptySubText}>Try changing the category or search term</Text>
          <Text style={styles.debugText}>Current category: {selectedCategoryId}</Text>
          <Text style={styles.debugText}>Total posts: {posts.length}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              navigation={navigation}
              handleLike={handleLike}
              handleOpenMap={handleOpenMap}
              handleDelete={handleDeletePost}
              handleReport={handleReport}
            />
          )}
          keyExtractor={(item) => item.post_id.toString()}
          style={styles.list}
          refreshing={loading}
          onRefresh={fetchPosts}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e", // Darker color for better eye comfort
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 70,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#2c2c2c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    height: 70,
    
  },
  filterLabel: {
    color: '#fff',
    fontSize: 16,
    marginRight: 12,
    fontWeight: '600',
  },
  dropdownContainer: {
    flex: 1,
    backgroundColor: "#444",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    color: "white",
    height: 48,
    paddingHorizontal: 10,
    padding: 27,
    backgroundColor: "#444",
  },
  list: {
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 40,
    gap: 10, // Spacing between PostCard
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  debugText: {
    color: '#777',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },

});