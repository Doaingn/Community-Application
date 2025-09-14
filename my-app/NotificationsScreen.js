import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotificationsAsync(userId) {
    console.log('Starting push notification registration...');

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Existing permission status:', existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('Requested permission status:', status);
        }

        if (finalStatus === 'granted') {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '6f0d37eb-b85e-4dba-89b3-1b2bd46e6768'
            });
            const token = tokenData.data;
            console.log('Got push token:', token);

            try {
                const response = await fetch('http://192.168.1.113:3000/api/save-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, pushToken: token }),
                });
                console.log('Token saved response status:', response.status);
            } catch (error) {
                console.error('Error saving token to backend:', error);
            }
        } else {
            console.log('Push notification permission denied');
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }
}

export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // API URL Config - ideally should be moved to a config file
    const API_BASE = 'http://192.168.1.113:3000/api';

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => hasUnread && (
                <TouchableOpacity 
                    style={styles.headerButton} 
                    onPress={markAllAsRead}
                >
                    <Text style={styles.headerButtonText}>Mark All As Read</Text>
                </TouchableOpacity>
            ),
        });
    }, [hasUnread, navigation]);

    const getActionMessage = (type) => {
        switch (type) {
            case 'like': return ` liked your post`;
            case 'comment': return ` commented on your post`;
            case 'follow': return ` started following you`;
            case 'report': return ` reported your post`;
            default: return ` interacted with your profile`;
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return { name: 'heart', color: '#FF4D4D', bgColor: 'rgba(255, 77, 77, 0.15)' };
            case 'comment': return { name: 'comment-text', color: '#4D9EFF', bgColor: 'rgba(77, 158, 255, 0.15)' };
            case 'follow': return { name: 'account-plus', color: '#50B44D', bgColor: 'rgba(80, 180, 77, 0.15)' };
            case 'report': return { name: 'flag', color: '#FFB74D', bgColor: 'rgba(255, 183, 77, 0.15)' };
            default: return { name: 'bell', color: '#FFFFFF', bgColor: 'rgba(255, 255, 255, 0.15)' };
        }
    };

    // API request helper function with better error handling
    const apiRequest = async (endpoint, options = {}) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${response.status}: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your internet connection.');
            }
            throw error;
        }
    };

    const fetchNotifications = async (pageNum = 1, shouldReset = false) => {
    try {
        if (shouldReset) {
            setPage(1);
            setNotifications([]);
            setError(null);
            pageNum = 1;
        }
        
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            throw new Error('User data not found. Please log in again.');
        }

        const data = await apiRequest(`/notifications/${userId}?page=${pageNum}&limit=15`);
        
        if (Array.isArray(data.notifications)) {
            const normalizedNotifications = data.notifications.map(notification => {
                return {
                    id: notification.notification_id,
                    type: notification.notification_type,
                    message: notification.message, // ใช้ message ที่มาจาก database
                    userImage: notification.sender_avatar 
                        ? `${API_BASE}/${notification.sender_avatar}` 
                        : 'https://via.placeholder.com/48',
                    user: notification.sender_username || 'Unknown User',
                    timestamp: formatTimeAgo(notification.created_at),
                    postId: notification.reference_id,
                    senderId: notification.sender_id,
                    receiverId: notification.user_id,
                    status: notification.status || 'unread'
                };
            });

            if (shouldReset || pageNum === 1) {
                setNotifications(normalizedNotifications);
            } else {
                setNotifications(prev => [...prev, ...normalizedNotifications]);
            }
            
            setHasUnread(prevHasUnread => {
                const newHasUnread = normalizedNotifications.some(note => note.status === 'unread');
                return pageNum === 1 ? newHasUnread : (prevHasUnread || newHasUnread);
            });
            
            setHasMore(data.hasMore || data.notifications.length === 15);
        } else {
            throw new Error('Invalid notifications data format');
        }
    } catch (error) {
        console.error('Error fetching notifications:', error.message);
        setError(error.message);
    } finally {
        setLoading(false);
        setLoadingMore(false);
    }
};

    const formatTimeAgo = (timestamp) => {
        try {
            const now = new Date();
            const date = new Date(timestamp);
            const seconds = Math.floor((now - date) / 1000);

            if (seconds < 60) return 'just now';

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;

            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}d ago`;

            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (error) {
            console.error('Error formatting date:', error);
            return timestamp;
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await apiRequest(`/notifications/read/${notificationId}`, {
                method: 'PUT'
            });

            setNotifications(prevNotifications => 
                prevNotifications.map(note => 
                    note.id === notificationId ? { ...note, status: 'read' } : note
                )
            );

            const stillHasUnread = notifications.some(note => 
                note.id !== notificationId && note.status === 'unread'
            );
            setHasUnread(stillHasUnread);

        } catch (error) {
            console.error('Error marking notification as read:', error);
            Alert.alert('Error', 'Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) return;

            await apiRequest(`/notifications/read-all/${userId}`, { 
                method: 'PUT' 
            });

            setNotifications(notifications.map(note => ({ ...note, status: 'read' })));
            setHasUnread(false);
            Alert.alert('Success', 'All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            Alert.alert('Error', 'Failed to mark all notifications as read');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications(1, true);
        setRefreshing(false);
    }, []);

    const loadMoreNotifications = async () => {
        if (hasMore && !loading && !loadingMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            await fetchNotifications(nextPage);
        }
    };

    //push noti token regist
    /*const registerForPushNotificationsAsync = async (userId) => {
    console.log('Starting push notification registration...');

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Existing permission status:', existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('Requested permission status:', status);
        }

        if (finalStatus === 'granted') {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '23849ad4-003a-4ef8-ab77-7e566ecec3a8'
            });
            const token = tokenData.data;
            console.log('Got push token:', token);

            // Replace this URL with your real backend API endpoint
            try {
                const response = await fetch('http://192.168.1.100:3000/api/save-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, pushToken: token }),
                });
                console.log('Token saved response status:', response.status);
            } catch (error) {
                console.error('Error saving token to backend:', error);
            }
        } else {
            console.log('Push notification permission denied');
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }
};*/


    useEffect(() => {
        const setupPushNotifications = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');
                if (userId) {
                    await registerForPushNotificationsAsync(userId);
                }
            } catch (error) {
                console.error('Error registering for push notifications:', error);
            }
        };

        setupPushNotifications();
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        navigation.setOptions({
            headerRight: () => hasUnread ? (
                <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
                    <Text style={styles.headerButtonText}>Mark All As Read</Text>
                </TouchableOpacity>
            ) : null
        });
    }, [hasUnread]);

    const handleNotificationPress = (item) => {
    if (item.status === 'unread') {
        markAsRead(item.id); // ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
    }

    // เช็คประเภทของการแจ้งเตือนและนำทางไปยังหน้าที่เกี่ยวข้อง
    switch (item.type) {
        case 'like':
            navigation.navigate('PostDetail', { postId: item.postId });
            break;
        case 'comment':
            // นำทางไปยังหน้ารายละเอียดโพสต์ โดยส่ง postId จากการแจ้งเตือน
            navigation.navigate('PostDetail', { postId: item.postId });
            break;
        case 'follow':
                // นำทางไปยังโปรไฟล์ของผู้ที่ติดตาม
                if (item.senderId) {
                    console.log('Navigating to profile with userId:', item.senderId);
                    navigation.navigate('Profile', { 
                        userId: item.senderId.toString() // แปลงเป็น string เพื่อความแน่ใจ
                    });
                }
        default:
            break;
    }
};


    const renderItem = ({ item }) => {
        const icon = getIcon(item.type);
        const isUnread = item.status === 'unread';
        
        return (
            <TouchableOpacity 
                style={[
                    styles.notificationItem, 
                    isUnread && styles.notificationUnread,
                    styles.cardShadow
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
                    <MaterialCommunityIcons name={icon.name} size={22} color={icon.color} />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.message} numberOfLines={2}>
                        <Text style={styles.username}>{item.user}</Text>
                        <Text style={styles.messageText}>{getActionMessage(item.type)}</Text>
                    </Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                
                {isUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => {
        if (loading) return null;
        
        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="wifi-off" size={64} color="#666" />
                    <Text style={styles.emptyTitle}>Could not load data</Text>
                    <Text style={styles.emptyText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={() => fetchNotifications(1, true)}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="bell-off-outline" size={64} color="#666" />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyText}>
                    You'll see notifications when someone interacts with your post or profile
                </Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#50B44D" />
                <Text style={styles.footerText}>Loading more...</Text>
            </View>
        );
    };

    if (loading && page === 1) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#101010" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#50B44D" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#101010" />
            
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[
                    styles.list,
                    notifications.length === 0 && styles.emptyList
                ]}
                ListEmptyComponent={renderEmptyComponent}
                ListFooterComponent={renderFooter}
                onEndReached={loadMoreNotifications}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#50B44D"
                        colors={['#50B44D']}
                    />
                }
                showsVerticalScrollIndicator={false}
                bounces={true}
                
                // Performance optimizations
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                windowSize={15}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101010',
    },
    list: {
        padding: 12,
        paddingTop: 8,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222222',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        position: 'relative',
        borderLeftWidth: 0,
    },
    cardShadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    notificationUnread: {
        backgroundColor: '#2a2a2a',
        borderLeftWidth: 3,
        borderLeftColor: '#50B44D',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        color: 'white',
        fontSize: 15,
        lineHeight: 22,
    },
    username: {
        fontWeight: 'bold',
        color: 'white',
    },
    messageText: {
        color: '#f0f0f0',
    },
    timestamp: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 4,
    },
    unreadDot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#50B44D',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#f0f0f0',
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        color: '#f0f0f0',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        backgroundColor: '#50B44D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        minWidth: 120,
        alignItems: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    headerButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
    },
    headerButtonText: {
        color: '#50B44D',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footerLoader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    footerText: {
        color: '#aaa',
        marginLeft: 8,
        fontSize: 14,
    }
});
