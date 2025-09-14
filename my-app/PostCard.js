import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Alert } from "react-native";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActionSheet from "react-native-actionsheet";
import { Video } from "expo-av";

const PostCard = ({ item, handleLike, handleOpenMap, handleDelete, navigation }) => {
  const [isOwner, setIsOwner] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const actionSheetRef = useRef();

  const goToProfile = (userId) => {
    navigation.navigate("Profile", { userId });
  };

  useEffect(() => {
    const checkIfOwner = async () => {
      try {
        const loggedInUserId = await AsyncStorage.getItem("userId");
        if (loggedInUserId === item.p_user_id.toString()) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Error checking owner status:", error);
      }
    };

    const fetchReportReasons = async () => {
      try {
        const response = await fetch('http://192.168.1.113:3000/api/violationtypes');
        const data = await response.json();
        setReportReasons(data);  // API returns array of violation types
      } catch (error) {
        console.error("Error fetching violation types:", error);
      }
    };

    checkIfOwner();
    fetchReportReasons();
  }, [item]);

  const showMenuOptions = () => {
    actionSheetRef.current?.show();
  };

  const onActionSheetItemSelected = (index) => {
    if (isOwner) {
      // Owner options
      if (index === 0) {
        // Edit
        navigation.navigate("EditPost", { postId: item.post_id });
      } else if (index === 1) {
        // Delete
        handleDelete(item.post_id);
      }
    } else {
      // Non-owner options - Report Post
      if (index !== reportReasons.length && reportReasons.length > 0) {
        handleReportPost(reportReasons[index]);
      }
    }
  };

  const handleReportPost = async (reason) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Error", "Please log in to report posts");
        return;
      }

      const response = await fetch('http://192.168.1.113:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: item.post_id,
          userId: userId,
          reason: reason
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Post reported successfully");
      } else {
        Alert.alert("Error", data.error || "Failed to report post");
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      Alert.alert("Error", "Failed to submit report");
    }
  };

  const renderMedia = (media) => {
    if (media.media_type === "image") {
      return <Image source={{ uri: `http://192.168.1.113:3000${media.media_url}` }} style={styles.postImage} />;
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

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => goToProfile(item.p_user_id)}>
          {item.user_avatar ? (
            <Image source={{ uri: `http://192.168.1.113:3000/${item.user_avatar}` }} style={styles.avatar} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={50} color="#aaa" style={styles.avatar} />  // Default icon if no avatar
          )}
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <TouchableOpacity onPress={() => goToProfile(item.p_user_id)}>
            <Text style={styles.name}>{item.username}</Text>
          </TouchableOpacity>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>

        <View style={styles.judHeader}>
          <TouchableOpacity onPress={showMenuOptions}>
            <MaterialCommunityIcons 
              name={isOwner ? "dots-vertical" : "flag-variant"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.postTopic}>{item.topic}</Text>
      <Text style={styles.postDescription}>{item.description}</Text>

      {item.media_files && item.media_files.length > 0 && (
        <FlatList
          data={item.media_files}
          horizontal
          renderItem={({ item: media, index }) => (
            <View key={index} style={styles.mediaContainer}>
              {renderMedia(media)}
            </View>
          )}
          keyExtractor={(media) => media.media_url}
        />
      )}

      {item.location && (
        <TouchableOpacity onPress={() => handleOpenMap(item.location)}>
          <Text style={styles.postLocation}>📍 {item.location}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.post_id, item.liked)}>
          <MaterialCommunityIcons name={item.liked ? "heart" : "heart-outline"} size={24} color={item.liked ? "#FF6B6B" : "white"} />
          <Text style={styles.likeText}>{item.like_count} Like</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Comments", { postId: item.post_id })} style={styles.commentButton}>
          <MaterialCommunityIcons name="comment-outline" size={24} color="white" />
          <Text style={styles.commentText}>Comment</Text>
        </TouchableOpacity>
      </View>

      <ActionSheet
        ref={actionSheetRef}
        options={isOwner 
          ? ["Edit", "Delete", "Cancel"] 
          : (reportReasons.length ? [...reportReasons, "Cancel"] : ["Loading...", "Cancel"])
        }
        cancelButtonIndex={isOwner ? 2 : reportReasons.length}
        destructiveButtonIndex={isOwner ? 1 : -1}
        onPress={onActionSheetItemSelected}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#4D4D4D",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },
  postLocation: {
    fontSize: 16,
    color: "#FFA500",
    marginTop: 10,
  },
});

export default PostCard;
