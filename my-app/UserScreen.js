import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const UserScreen = () => {
  const navigation = useNavigation();
  const userProfileImage = null;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [showStatusMessage, setShowStatusMessage] = useState(false);

  // Fetch users with error handling and retry
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/users");
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showMessage("error", "Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Improved status message function with auto-hide
  const showMessage = (type, message) => {
    setStatusMessage({ type, message });
    setShowStatusMessage(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowStatusMessage(false);
    }, 3000);
  };

  // Search functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(text.toLowerCase()) ||
        user.email.toLowerCase().includes(text.toLowerCase()) ||
        (user.role && user.role.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  // Set up edit modal with user data
  const editUser = (user) => {
    setEditingUser(user);
    setUsername(user.username || "");
    setEmail(user.email || "");
    setRole(user.role || "");
    setModalVisible(true);
  };

  // Improved save functionality with proper validation and error handling
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Basic validation
    if (!username.trim() || !email.trim()) {
      showMessage("error", "Username and email are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/users/${editingUser.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            role,
          }),
        }
      );

      const responseData = await res.json();

      if (res.ok) {
        // Update local state to reflect changes without requiring a full refetch
        const updatedUsers = users.map((user) =>
          user.user_id === editingUser.user_id
            ? { ...user, username, email, role }
            : user
        );

        setUsers(updatedUsers);
        setFilteredUsers(
          searchQuery
            ? updatedUsers.filter(
                (user) =>
                  user.username
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  user.email
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (user.role &&
                    user.role.toLowerCase().includes(searchQuery.toLowerCase()))
              )
            : updatedUsers
        );

        showMessage("success", "User updated successfully");
        setModalVisible(false);
      } else {
        showMessage("error", responseData.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Edit error:", error);
      showMessage("error", "Network error: Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation modal before deletion
  const removeUser = (userId) => {
    setUserToDelete(userId);
    setConfirmModalVisible(true);
  };

  // Improved delete with proper error handling
  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3000/api/users/${userToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        // Update local state to remove deleted user
        const updatedUsers = users.filter(
          (user) => user.user_id !== userToDelete
        );
        setUsers(updatedUsers);
        setFilteredUsers(
          searchQuery
            ? updatedUsers.filter(
                (user) =>
                  user.username
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  user.email
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (user.role &&
                    user.role.toLowerCase().includes(searchQuery.toLowerCase()))
              )
            : updatedUsers
        );

        showMessage("success", "User deleted successfully");
      } else {
        const errorData = await res.json();
        showMessage("error", errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showMessage("error", "Network error: Failed to delete user");
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
      setUserToDelete(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { flexDirection: "row", alignItems: "center" }]}>
      <View style={{ flex: 2 }}>
        <Text style={styles.colDataText}>ID: {item.user_id}</Text>
        <Text style={styles.colDataText}>Username: {item.username}</Text>
        <Text style={styles.colDataText}>Email: {item.email}</Text>
        <Text style={styles.colDataText}>Role: {item.role || "N/A"}</Text>
      </View>
      <View
        style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          onPress={() => editUser(item)}
          style={{ marginHorizontal: 10 }}
        >
          <Text style={[styles.actionText, { color: "#4CAF50" }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeUser(item.user_id)}>
          <Text style={[styles.actionText, { color: "#F44336" }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && users.length === 0) {
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
            <Text style={styles.navItem}>FORUM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("User")}>
            <Text style={styles.CnavItem}>USER</Text>
          </TouchableOpacity>
          {userProfileImage ? (
            <Image source={{ uri: userProfileImage }} style={styles.avatar} />
          ) : (
            <Text style={styles.profile}>My Profile</Text>
          )}
        </View>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Users List</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        placeholderTextColor="#AAAAAA"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Status message toast with improved visibility */}
      {showStatusMessage && (
        <View
          style={[
            styles.statusMessage,
            statusMessage.type === "success"
              ? styles.successMessage
              : styles.errorMessage,
          ]}
        >
          <Text style={styles.statusMessageText}>{statusMessage.message}</Text>
        </View>
      )}

      {loading && users.length > 0 && (
        <ActivityIndicator
          size="small"
          color="#FFCC00"
          style={{ marginTop: 10 }}
        />
      )}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? "No users matching your search" : "No users found"}
            </Text>
          </View>
        }
      />

      {/* Modal for editing user - with improved UI and validation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit User</Text>

            <Text style={styles.inputLabel}>
              Username: <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>
              Email: <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Role:</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="Role"
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
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.textStyle}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation modal for delete */}
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
              Are you sure you want to delete this user? This action cannot be
              undone.
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
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.textStyle}>Delete</Text>
                )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFCC00",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#4D4D4D",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#555555",
    width: "98%",
    alignSelf: "center",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#4D4D4D",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12, // Increased padding for better readability
  },
  tableHeader: {
    backgroundColor: "#4D4D4D",
  },
  colHeaderText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  colDataText: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 2, // Added margin for better spacing
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFCC00",
    marginBottom: 15,
    textAlign: "center",
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
  inputLabel: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 5,
    flexDirection: "row",
  },
  requiredStar: {
    color: "#F44336",
    fontSize: 18,
  },
  input: {
    backgroundColor: "#4D4D4D",
    color: "#ffffff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
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
    alignItems: "center", // Center button text properly
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
  actionText: {
    fontSize: 16,
  },
  statusMessage: {
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  successMessage: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  errorMessage: {
    backgroundColor: "rgba(244, 67, 54, 0.8)",
  },
  statusMessageText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold", // Added bold for better visibility
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#B0B0B0",
    fontSize: 16,
    textAlign: "center",
  },
});

export default UserScreen;
