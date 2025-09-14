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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const ReportScreen = () => {
  const navigation = useNavigation();
  const userProfileImage = null;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [reportToAction, setReportToAction] = useState(null);
  const [actionType, setActionType] = useState(null); // "remove" or "reject"

  // API Base URL - แก้ไข URL ให้ถูกต้อง
  const API_BASE_URL = "http://localhost:3000"; // เปลี่ยนเป็น IP ที่ถูกต้อง

  // Status options for dropdown
  const statusOptions = ["Pending", "In-Progress", "Resolved"]; // Fixed typos here

  // Test connection function - เพิ่มฟังก์ชันทดสอบการเชื่อมต่อ
  const testConnection = async () => {
    try {
      console.log("Testing connection to:", `${API_BASE_URL}/api/reports`);

      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "HEAD", // ใช้ HEAD request เพื่อทดสอบ
      });

      console.log("Connection test result:", response.status);
      return response.ok;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  };

  // Fetch all reports from API with better error handling
  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching reports from:", `${API_BASE_URL}/api/reports`);

      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `HTTP ${res.status}`
        );
      }

      const data = await res.json();
      console.log("Fetched data:", data);

      if (Array.isArray(data)) {
        setReports(data);
      } else {
        console.error("Expected array but got:", typeof data, data);
        throw new Error("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to fetch reports. ";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage +=
          "Cannot connect to server. Please check if the server is running.";
      } else if (error.message.includes("JSON")) {
        errorMessage += "Server returned invalid data.";
      } else {
        errorMessage += error.message || "Please try again.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Search reports with better error handling
  const searchReports = async (query) => {
    if (!query.trim()) {
      fetchReports();
      return;
    }

    setSearching(true);
    setError(null);

    try {
      console.log("Searching reports with query:", query);

      const res = await fetch(
        `${API_BASE_URL}/api/reports/search?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Search response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `HTTP ${res.status}`
        );
      }

      const data = await res.json();
      console.log("Search results:", data);

      if (Array.isArray(data)) {
        setReports(data);
      } else {
        throw new Error("Invalid search results format");
      }
    } catch (error) {
      console.error("Failed to search reports:", error);
      setError(`Failed to search reports: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  // Handle search input changes
  const handleSearch = (text) => {
    setSearchQuery(text);
    searchReports(text);
  };

  useEffect(() => {
    // Test connection first
    testConnection().then((isConnected) => {
      if (isConnected) {
        fetchReports();
      } else {
        setError(
          "Cannot connect to server. Please check if the backend server is running on the correct port."
        );
      }
    });
  }, []);

  // Format date for display
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

  // Update report status with better error handling
  const updateReportStatus = async (reportId, newStatus) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Updating report ${reportId} status to ${newStatus}`);

      const res = await fetch(
        `${API_BASE_URL}/api/reports/${reportId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      console.log("Update status response:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.details || errorData.error || `HTTP ${res.status}`
        );
      }

      // Update local state to reflect the change
      setReports(
        reports.map((report) =>
          report.report_id === reportId
            ? { ...report, status: newStatus }
            : report
        )
      );

      console.log(`Report ${reportId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      setError(`Failed to update status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation modal
  const confirmAction = (report, type) => {
    setReportToAction(report);
    setActionType(type);
    setConfirmModalVisible(true);
  };

  // Handle report actions with improved error handling
  const handleConfirmAction = async () => {
    if (!reportToAction) return;

    try {
      setLoading(true);
      setError(null);

      let success = false;

      if (actionType === "remove") {
        // Remove post and report
        success = await removePost();
      } else if (actionType === "reject") {
        // Reject report only
        success = await rejectReport();
      }

      // Only close modal on success
      if (success) {
        setConfirmModalVisible(false);
        setReportToAction(null);
        setActionType(null);
      }
    } catch (error) {
      console.error(`Action error (${actionType}):`, {
        message: error.message,
        stack: error.stack,
        reportId: reportToAction?.report_id,
        postId: reportToAction?.report_post_id,
      });
      setError(`Failed to ${actionType}. Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove post and all related reports from UI and database
  const removePost = async () => {
    if (!reportToAction || !reportToAction.report_post_id) {
      console.error("Invalid post ID for deletion");
      setError("Cannot delete post: Invalid post ID");
      return false;
    }

    try {
      const postIdToDelete = reportToAction.report_post_id;
      console.log(`Attempting to delete post with ID: ${postIdToDelete}`);

      // Step 1: Delete the post and its associated media
      const deletePostRes = await fetch(
        `${API_BASE_URL}/api/posts/${postIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Log the raw response status for debugging
      console.log(
        `Delete post API response status: ${deletePostRes.status} ${deletePostRes.statusText}`
      );

      // Try to parse response as JSON, regardless of status code
      let postResponseBody;
      try {
        postResponseBody = await deletePostRes.json();
        console.log("Post deletion API response body:", postResponseBody);
      } catch (jsonError) {
        console.error(
          "Failed to parse post deletion response as JSON:",
          jsonError
        );
        postResponseBody = { error: "Failed to parse response" };
      }

      if (!deletePostRes.ok) {
        // Detailed error information
        const errorDetail =
          postResponseBody.error || `HTTP error ${deletePostRes.status}`;
        console.error(`API error details for post deletion: ${errorDetail}`);
        throw new Error(errorDetail);
      }

      // Step 2: Delete all reports related to this post from the database
      console.log(
        `Attempting to delete all reports for post ID: ${postIdToDelete}`
      );

      const deleteReportsRes = await fetch(
        `${API_BASE_URL}/api/reports/bypost/${postIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Log the reports deletion response
      console.log(
        `Delete reports API response status: ${deleteReportsRes.status} ${deleteReportsRes.statusText}`
      );

      let reportsResponseBody;
      try {
        reportsResponseBody = await deleteReportsRes.json();
        console.log("Reports deletion API response:", reportsResponseBody);
      } catch (jsonError) {
        console.error(
          "Failed to parse reports deletion response as JSON:",
          jsonError
        );
      }

      if (!deleteReportsRes.ok) {
        // Just log the error but continue, as the post was already deleted
        console.error(
          `Error removing reports from database: ${
            reportsResponseBody?.error || deleteReportsRes.statusText
          }`
        );
      } else {
        console.log(
          `Successfully removed ${
            reportsResponseBody?.count || "all"
          } reports for post ${postIdToDelete} from database`
        );
      }

      // Success handling - update UI
      console.log("Post and reports deletion completed");

      // Remove ALL reports with the same post ID from our local state
      setReports(reports.filter((r) => r.report_post_id !== postIdToDelete));

      // Show success message to user
      Alert.alert(
        "Success",
        "Post and all associated reports were removed successfully from system.",
        [{ text: "OK" }]
      );

      return true;
    } catch (error) {
      // Comprehensive error logging
      console.error("Remove post and reports error details:", {
        message: error.message,
        stack: error.stack,
        postId: reportToAction?.report_post_id,
      });

      // More descriptive error message for the user
      setError(
        `Failed to remove post or its reports: ${error.message}. Check network connection and API status.`
      );

      return false;
    }
  };

  // Reject report without removing post - with improved error handling
  const rejectReport = async () => {
    try {
      console.log(
        `Attempting to reject report with ID: ${reportToAction.report_id}`
      );

      const res = await fetch(
        `${API_BASE_URL}/api/reports/${reportToAction.report_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Log the raw response for debugging
      console.log(
        `Reject API response status: ${res.status} ${res.statusText}`
      );

      // Try to parse response as JSON for more details
      let responseBody;
      try {
        responseBody = await res.json();
        console.log("Reject API response body:", responseBody);
      } catch (jsonError) {
        console.error("Failed to parse reject response as JSON:", jsonError);
      }

      if (!res.ok) {
        // Extract detailed error info if available
        const errorDetail = responseBody?.error || `HTTP error ${res.status}`;
        throw new Error(errorDetail);
      }

      console.log(`Report ${reportToAction.report_id} rejected successfully`);

      // Update local state
      setReports(
        reports.filter((r) => r.report_id !== reportToAction.report_id)
      );

      // Show success message
      Alert.alert("Success", "Report was rejected successfully.", [
        { text: "OK" },
      ]);

      return true;
    } catch (error) {
      console.error("Reject report detailed error:", {
        message: error.message,
        stack: error.stack,
        reportId: reportToAction?.report_id,
      });
      setError(`Failed to reject report: ${error.message}`);
      return false;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportId}>Report ID: #{item.report_id}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status: </Text>
          <Picker
            selectedValue={item.status}
            style={styles.statusPicker}
            onValueChange={(itemValue) =>
              updateReportStatus(item.report_id, itemValue)
            }
            dropdownIconColor="#FFFFFF"
          >
            {statusOptions.map((status) => (
              <Picker.Item
                key={status}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={status}
                color="#FFFFFF"
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.reportDetails}>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Post ID: </Text>
          {item.report_post_id}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Reported by: </Text>
          {item.reporter_username
            ? `${item.reporter_username} (#${item.report_by_user_id})`
            : `User #${item.report_by_user_id}`}
        </Text>
        {item.post_topic && (
          <Text style={styles.detailItem}>
            <Text style={styles.detailLabel}>Post Topic: </Text>
            {item.post_topic}
          </Text>
        )}
        <Text style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date: </Text>
          {formatDate(item.date)}
        </Text>
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.detailLabel}>Reason:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => confirmAction(item, "remove")}
          style={[styles.actionButton, styles.removeButton]}
        >
          <Text style={styles.actionText}>Remove Post</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => confirmAction(item, "reject")}
          style={[styles.actionButton, styles.rejectButton]}
        >
          <Text style={styles.actionText}>Reject Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && reports.length === 0) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Loading reports...</Text>
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
            <Text style={styles.CnavItem}>REPORT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Forum")}>
            <Text style={styles.navItem}>FORUM</Text>
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
        <Text style={styles.headerTitle}>Reports Management</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
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

      {/* Display error messages if any */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.dismissError}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={reports}
        keyExtractor={(item) => item.report_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No reports matching your search"
                : "No reports found"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchReports}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Confirmation modal for actions */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.confirmTitle}>
              {actionType === "remove" ? "Remove Post" : "Reject Report"}
            </Text>
            <Text style={styles.confirmText}>
              {actionType === "remove"
                ? "This will delete the post and all associated reports. Continue?"
                : "This will dismiss the report but keep the post. Continue?"}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  actionType === "remove"
                    ? styles.buttonDelete
                    : styles.buttonReject,
                ]}
                onPress={handleConfirmAction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.textStyle}>Confirm</Text>
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
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportId: {
    color: "#FFCC00",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusLabel: {
    color: "#ffffff",
    marginRight: 5,
  },
  statusPicker: {
    height: 30,
    width: 140,
    color: "#ffffff",
    backgroundColor: "#3A3A3A",
  },
  reportDetails: {
    marginBottom: 12,
  },
  detailItem: {
    color: "#E0E0E0",
    fontSize: 14,
    marginBottom: 6,
  },
  detailLabel: {
    color: "#B0B0B0",
    fontWeight: "bold",
  },
  reasonContainer: {
    marginBottom: 12,
    backgroundColor: "#3A3A3A",
    padding: 10,
    borderRadius: 8,
  },
  reasonText: {
    color: "#E0E0E0",
    fontSize: 14,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 0.48,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#dd0808",
  },
  rejectButton: {
    backgroundColor: "#9E9E9E",
  },
  actionText: {
    color: "#ffffff",
    fontWeight: "bold",
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
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 0.48,
  },
  buttonCancel: {
    backgroundColor: "#9E9E9E",
  },
  buttonDelete: {
    backgroundColor: "#F44336",
  },
  buttonReject: {
    backgroundColor: "#FF9800",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
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
  retryButton: {
    backgroundColor: "#FFCC00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: "#303030",
    fontWeight: "bold",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(244, 67, 54, 0.8)", // Semi-transparent red
    margin: 16,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#ffffff",
    flex: 1,
  },
  dismissError: {
    color: "#ffffff",
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default ReportScreen;