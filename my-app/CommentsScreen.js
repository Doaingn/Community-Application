import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Image, FlatList, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import ActionSheet from 'react-native-actionsheet';

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CommentScreen({ route, navigation }) {
  const { postId } = route.params;
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const actionSheetRef = useRef();
  const [selectedComment, setSelectedComment] = useState(null);

  useEffect(() => {
    fetchComments();
    getCurrentUserId();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://192.168.1.113:3000/api/comments/${postId}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const goToProfile = (userId) => {
    navigation.navigate("Profile", { userId });
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      const response = await fetch('http://192.168.1.113:3000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: parseInt(userId),
          commentText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCommentText('');
        fetchComments();
      } else {
        Alert.alert('Error', data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while posting comment.');
    }
  };

  const showCommentOptions = (comment) => {
    setSelectedComment(comment);
    actionSheetRef.current?.show();
  };

  const onActionSheetItemSelected = (index) => {
    if (!selectedComment) return;

    if (index === 0) {
      // Edit
      handleEditComment(selectedComment);
    } else if (index === 1) {
      // Delete
      handleDeleteComment(selectedComment.comment_id);
    }
    setSelectedComment(null);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.comment_text);
    setEditModalVisible(true);
  };

  const saveEditedComment = async () => {
    if (!editCommentText.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    console.log('Saving edited comment:', {
      commentId: editingComment.comment_id,
      userId: currentUserId,
      commentText: editCommentText
    });

    try {
      const response = await fetch(`http://192.168.1.113:3000/api/comments/${editingComment.comment_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(currentUserId),
          commentText: editCommentText,
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        setEditModalVisible(false);
        setEditingComment(null);
        setEditCommentText('');
        fetchComments();
        Alert.alert('Success', 'Comment updated successfully');
      } else {
        console.error('Server error:', data);
        Alert.alert('Error', data.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'An error occurred while updating comment.');
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComment(commentId),
        },
      ]
    );
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`http://192.168.1.113:3000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(currentUserId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchComments();
        Alert.alert('Success', 'Comment deleted successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while deleting comment.');
    }
  };

  const renderComment = ({ item }) => {
    const isOwner = currentUserId && item.user_id.toString() === currentUserId;

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={() => goToProfile(item.user_id)}>
            {item.user_avatar ? (
              <Image source={{ uri: `http://192.168.1.113:3000/${item.user_avatar}` }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={40} color="#aaa" style={styles.avatar} />
            )}
          </TouchableOpacity>
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeText}>
              {formatTimeAgo(item.created_at)}
              {item.updated_at && item.updated_at !== item.created_at && ' (edited)'}
            </Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => showCommentOptions(item)}
            >
              <MaterialCommunityIcons name="dots-vertical" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentText}>{item.comment_text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.comment_id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderComment}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Write a comment..."
          placeholderTextColor="white"
          value={commentText}
          onChangeText={setCommentText}
          style={styles.textInput}
          multiline
          maxLength={250}
        />
        <TouchableOpacity style={styles.button} onPress={handlePostComment}>
          <Text style={styles.buttonText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Comment Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Comment</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              value={editCommentText}
              onChangeText={setEditCommentText}
              style={styles.editTextInput}
              multiline
              maxLength={250}
              placeholder="Edit your comment..."
              placeholderTextColor="#aaa"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditedComment}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Sheet for Comment Options */}
      <ActionSheet
        ref={actionSheetRef}
        options={['Edit', 'Delete', 'Cancel']}
        cancelButtonIndex={2}
        destructiveButtonIndex={1}
        onPress={onActionSheetItemSelected}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  commentCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  usernameContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  username: {
    fontWeight: '700',
    color: '#F58637',
    fontSize: 18,
  },
  timeText: {
    fontSize: 13,
    color: '#aaa',
  },
  optionsButton: {
    padding: 5,
  },
  commentText: {
    fontSize: 17,
    color: '#f1f1f1',
    lineHeight: 20,
    marginTop: 6,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 16,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    fontSize: 15,
    color: '#fff',
  },
  button: {
    marginLeft: 12,
    backgroundColor: '#F58637',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  editTextInput: {
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#F58637',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});