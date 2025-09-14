import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const ForumScreen = () => {
  const navigation = useNavigation();
  const userProfileImage = null;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  // New state for confirmation modal
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // ดึงข้อมูลโพสต์ทั้งหมดจาก API
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      // Replace Alert with console.error for browser compatibility
      console.error("Failed to fetch posts:", error);
      // You could also add a state for error messages and display them in the UI
    }
    setLoading(false);
  };

  // ค้นหาโพสต์
  const searchPosts = async (query) => {
    if (!query.trim()) {
      fetchPosts();
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/posts/search?query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("Failed to search posts:", error);
    }
    setSearching(false);
  };

  // Handle search input changes
  const handleSearch = (text) => {
    setSearchQuery(text);
    searchPosts(text);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const editPost = (post) => {
    setEditingPost(post);
    setTopic(post.topic);
    setDescription(post.description);
    setLocation(post.location || "");
    setModalVisible(true);
  };

  const viewPost = (post) => {
    setSelectedPost(post);
    setViewModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/api/posts/${editingPost.post_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            description,
            location,
          }),
        }
      );

      if (res.ok) {
        console.log("Post updated successfully");
        setModalVisible(false);
        // Reset state
        setEditingPost(null);
        setTopic("");
        setDescription("");
        setLocation("");
        // Refresh post list
        fetchPosts();
      } else {
        const errorData = await res.json();
        console.error("Failed to update post:", errorData.error);
      }
    } catch (error) {
      console.error("Edit error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Modified removePost to show confirmation modal instead of Alert
  const removePost = (postId) => {
    setPostToDelete(postId);
    setConfirmModalVisible(true);
  };

  // New function to handle actual deletion after confirmation
  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/api/posts/${postToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        console.log("Post deleted successfully");
        fetchPosts(); // Refresh post list
      } else {
        const errorData = await res.json();
        console.error("Failed to delete post:", errorData.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
      setPostToDelete(null);
    }
  };

  // ฟังก์ชันแสดงวันที่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: item.user_avatar
                ? `http://localhost:3000/${item.user_avatar}`
                : "https://via.placeholder.com/40",
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.username}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>

      <Text style={styles.topic}>{item.topic}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      {item.location && <Text style={styles.location}>📍 {item.location}</Text>}

      {item.media_files && item.media_files.length > 0 && (
        <Text style={styles.mediaCount}>
          {item.media_files.length} media attached
        </Text>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => viewPost(item)}
          style={styles.actionButton}
        >
          <Text style={[styles.actionText, { color: "#4FC3F7" }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => editPost(item)}
          style={styles.actionButton}
        >
          <Text style={[styles.actionText, { color: "#4CAF50" }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => removePost(item.post_id)}
          style={styles.actionButton}
        >
          <Text style={[styles.actionText, { color: "#F44336" }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#FFCC00" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
            <Text style={styles.navItem}>DASHBOARD</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Report")}>
            <Text style={styles.navItem}>REPORT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Forum")}>
            <Text style={styles.CnavItem}>FORUM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("User")}>
            <Text style={styles.navItem}>USER</Text>
          </TouchableOpacity>
          {userProfileImage ? (
            <Image
              source={{ uri: userProfileImage }}
              style={styles.profileAvatar}
            />
          ) : (
            <Text style={styles.profile}>My Profile</Text>
          )}
        </View>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Posts List</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searching && (
            <ActivityIndicator
              size="small"
              color="#FFCC00"
              style={styles.searchLoader}
            />
          )}
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No posts matching your search" : "No posts found"}
            </Text>
          </View>
        }
      />

      {/* Modal for editing post */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Post</Text>

            <Text style={styles.inputLabel}>Topic:</Text>
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="Topic"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Description:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Location:</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location (optional)"
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.textStyle}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for viewing post details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewModalVisible}
        onRequestClose={() => setViewModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedPost && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPost.topic}</Text>
                  <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.postHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{
                        uri: selectedPost.user_avatar
                          ? `http://localhost:3000/${selectedPost.user_avatar}`
                          : "https://via.placeholder.com/40",
                      }}
                      style={styles.avatar}
                    />
                    <Text style={styles.username}>{selectedPost.username}</Text>
                  </View>
                  <Text style={styles.date}>
                    {formatDate(selectedPost.created_at)}
                  </Text>
                </View>

                <ScrollView style={styles.modalContent}>
                  <Text style={styles.fullDescription}>
                    {selectedPost.description}
                  </Text>

                  {selectedPost.location && (
                    <Text style={styles.location}>
                      📍 {selectedPost.location}
                    </Text>
                  )}

                  {selectedPost.media_files &&
                    selectedPost.media_files.length > 0 && (
                      <View style={styles.mediaContainer}>
                        <Text style={styles.mediaTitle}>Media Files:</Text>
                        <FlatList
                          data={selectedPost.media_files}
                          keyExtractor={(item) => item.media_id.toString()}
                          horizontal={true}
                          renderItem={({ item }) => (
                            <View style={styles.mediaItem}>
                              <Image
                                source={{
                                  uri: `http://localhost:3000${item.media_url}`,
                                }}
                                style={styles.mediaImage}
                                resizeMode="cover"
                              />
                            </View>
                          )}
                        />
                      </View>
                    )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* New confirmation modal for delete */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, styles.confirmModalView]}>
            <Text style={styles.confirmTitle}>Confirm Delete</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this post?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDelete]}
                onPress={confirmDelete}
              >
                <Text style={styles.textStyle}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#303030",
  },
  headerContainer: {
    flexDirection: "column",
    marginHorizontal: 16,
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFCC00",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4D4D4D",
    borderRadius: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    paddingHorizontal: 15,
    height: 40,
  },
  searchLoader: {
    marginRight: 10,
  },
  card: {
    backgroundColor: "#4D4D4D",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  username: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  date: {
    color: "#B0B0B0",
    fontSize: 12,
  },
  topic: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  description: {
    color: "#E0E0E0",
    fontSize: 14,
    marginBottom: 8,
  },
  location: {
    color: "#B0B0B0",
    fontSize: 12,
    marginBottom: 8,
  },
  mediaCount: {
    color: "#4FC3F7",
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 16,
  },
  actionText: {
    fontSize: 16,
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItem: {
    color: "#ffffff",
    marginHorizontal: 10,
    fontSize: 18,
  },
  CnavItem: {
    color: "#F58637",
    marginHorizontal: 10,
    fontSize: 18,
  },
  profile: {
    color: "#FFCC00",
    marginLeft: 20,
    fontSize: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#3A3A3A",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalView: {
    maxHeight: "auto",
    width: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFCC00",
    flex: 1,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFCC00",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  closeButton: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalContent: {
    maxHeight: 400,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#4D4D4D",
    color: "#ffffff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 0.48,
  },
  buttonSave: {
    backgroundColor: "#4CAF50",
  },
  buttonCancel: {
    backgroundColor: "#9E9E9E",
  },
  buttonDelete: {
    backgroundColor: "#F44336",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  fullDescription: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 16,
  },
  mediaContainer: {
    marginTop: 16,
  },
  mediaTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  mediaItem: {
    marginRight: 10,
  },
  mediaImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#B0B0B0",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});

export default ForumScreen;
