import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActionSheet from "react-native-actionsheet";
import { Video } from "expo-av";

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;

  const [post, setPost] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  const actionSheetRef = useRef();

  // Fetch post details & violation reasons
  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const loggedInUserId = await AsyncStorage.getItem("userId");

      // Fetch post details
      const postRes = await fetch(
        `http://192.168.1.113:3000/posts/${postId}?userId=${loggedInUserId || 0}`
      );
      if (!postRes.ok) throw new Error("Failed to fetch post details");
      const postData = await postRes.json();

      // Fetch violation types for report
      const reportRes = await fetch("http://192.168.1.113:3000/api/violationtypes");
      if (!reportRes.ok) throw new Error("Failed to fetch violation types");
      const reportData = await reportRes.json();

      setPost(postData);
      setReportReasons(reportData);
      setIsOwner(loggedInUserId === postData.p_user_id.toString());
    } catch (error) {
      console.error("Error fetching post details:", error);
      Alert.alert("Error", error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const showActionSheet = () => {
    actionSheetRef.current?.show();
  };

  const onActionSheetSelect = (index) => {
    if (isOwner) {
      // Owner options: Edit, Delete, Cancel
      if (index === 0) {
        navigation.navigate("EditPost", { postId: post.post_id });
      } else if (index === 1) {
        confirmDeletePost(post.post_id);
      }
    } else {
      // User options: Report reasons + Cancel
      if (index !== reportReasons.length && reportReasons.length > 0) {
        handleReportPost(reportReasons[index]);
      }
    }
  };

  // Report a post
  const handleReportPost = async (reason) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        return Alert.alert("Error", "โปรดเข้าสู่ระบบเพื่อรายงานโพสต์");
      }

      const response = await fetch("http://192.168.1.113:3000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.post_id, userId, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "รายงานโพสต์เรียบร้อย");
      } else {
        Alert.alert("Error", data.error || "รายงานโพสต์ไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการรายงานโพสต์");
    }
  };

  // Confirm before deleting a post
  const confirmDeletePost = (postId) => {
    Alert.alert(
      "ยืนยันการลบโพสต์",
      "คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => deletePost(postId),
        },
      ]
    );
  };

  // Delete post API call
  const deletePost = async (postId) => {
    try {
      const res = await fetch(`http://192.168.1.113:3000/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        Alert.alert("สำเร็จ", "ลบโพสต์เรียบร้อย");
        navigation.goBack();
      } else {
        Alert.alert("ผิดพลาด", "ไม่สามารถลบโพสต์ได้");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("ผิดพลาด", "เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  // Like/unlike post
  const handleLike = async (postId, liked) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        return Alert.alert("โปรดเข้าสู่ระบบเพื่อกดไลก์");
      }

      const url = liked
        ? "http://192.168.1.113:3000/api/unlike"
        : "http://192.168.1.113:3000/api/like";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setPost((prev) => ({
          ...prev,
          liked: data.liked,
          like_count: data.like_count,
        }));
      } else {
        Alert.alert("Error", data.error || "ไม่สามารถกดไลก์ได้");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "ไม่สามารถกดไลก์ได้");
    }
  };

  // Render image or video based on media_type
  const renderMedia = (media) => {
    if (media.media_type === "image") {
      return (
        <Image
          source={{ uri: `http://192.168.1.113:3000${media.media_url}` }}
          style={styles.postImage}
        />
      );
    }

    return (
      <Video
        source={{ uri: `http://192.168.1.113:3000${media.media_url}` }}
        useNativeControls
        resizeMode="contain"
        style={styles.postImage}
      />
    );
  };

  // Open Google Maps with location query
  const openMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open map:", err)
    );
  };

  // --- RENDER ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F58637" />
        <Text style={styles.loadingText}>กำลังโหลดโพสต์...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#fff" }}>ไม่พบโพสต์นี้</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.postContainer}>
          {/* Header */}
          <View style={styles.postHeader}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile", { userId: post.p_user_id })}
            >
              {post.user_avatar ? (
                <Image
                  source={{ uri: `http://192.168.1.113:3000/${post.user_avatar}` }}
                  style={styles.avatar}
                />
              ) : (
                <MaterialCommunityIcons
                  name="account-circle"
                  size={50}
                  color="#aaa"
                  style={styles.avatar}
                />
              )}
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Profile", { userId: post.p_user_id })}
              >
                <Text style={styles.name}>{post.username}</Text>
              </TouchableOpacity>
              <Text style={styles.date}>
                {new Date(post.created_at).toLocaleString()}
              </Text>
            </View>

            <View style={styles.judHeader}>
              <TouchableOpacity onPress={showActionSheet}>
                <MaterialCommunityIcons
                  name={isOwner ? "dots-vertical" : "flag-variant"}
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.postTopic}>{post.topic}</Text>
          <Text style={styles.postDescription}>{post.description}</Text>

          {/* Media */}
          {post.media_files?.length > 0 && (
            <FlatList
              data={post.media_files}
              horizontal
              keyExtractor={(item) => item.media_url}
              renderItem={({ item: media, index }) => (
                <View key={index} style={styles.mediaContainer}>
                  {renderMedia(media)}
                </View>
              )}
              showsHorizontalScrollIndicator={false}
            />
          )}

          {/* Location */}
          {post.location && (
            <TouchableOpacity onPress={() => openMap(post.location)}>
              <Text style={styles.postLocation}>📍 {post.location}</Text>
            </TouchableOpacity>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleLike(post.post_id, post.liked)}
            >
              <MaterialCommunityIcons
                name={post.liked ? "heart" : "heart-outline"}
                size={24}
                color={post.liked ? "#FF6B6B" : "white"}
              />
              <Text style={styles.likeText}>{post.like_count} Like</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commentButton}
              onPress={() => navigation.navigate("Comments", { postId: post.post_id })}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color="white"
              />
              <Text style={styles.commentText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ActionSheet */}
      <ActionSheet
        ref={actionSheetRef}
        options={
          isOwner
            ? ["Edit", "Delete", "Cancel"]
            : reportReasons.length > 0
            ? [...reportReasons, "Cancel"]
            : ["Loading...", "Cancel"]
        }
        cancelButtonIndex={isOwner ? 2 : reportReasons.length}
        destructiveButtonIndex={isOwner ? 1 : -1}
        onPress={onActionSheetSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e1e1e",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
  },

  // Post Container - คล้ายกับ PostCard
  postContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#4D4D4D",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    margin: 15,
  },
  
  // Header Style - เหมือนกับ PostCard
  postHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  judHeader: {
    marginLeft: "auto",
    padding: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F58637",
  },
  date: {
    fontSize: 14,
    color: "#ffffff",
  },

  // Content Style - เหมือนกับ PostCard
  postTopic: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#ffffff",
  },
  postDescription: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 15,
  },

  // Media Style - เหมือนกับ PostCard
  postImage: {
    width: 320,
    height: 320,
    marginHorizontal: 5,
    resizeMode: "cover",
    borderRadius: 8,
  },
  mediaContainer: {
    marginRight: 10,
  },

  // Location Style - เหมือนกับ PostCard
  postLocation: {
    fontSize: 16,
    color: "#FFA500",
    marginTop: 10,
  },

  // Actions Style - เหมือนกับ PostCard
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ffffff",
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ffffff",
  },
});

export default PostDetail;