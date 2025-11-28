/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';

interface Notification {
    id: string;
    type: 'appointment' | 'reminder' | 'news' | 'status' | 'promotion';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Timestamp;
    relatedId?: string; // ID của lịch hẹn hoặc dịch vụ liên quan
}

const NotificationScreen = ({ navigation }: { navigation: any }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [backgroundTasksCompleted, setBackgroundTasksCompleted] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
    const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
    const currentUser = getAuth().currentUser;

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            const db = getFirestore(getApp());
            const unreadNotifications = notifications.filter(n => !n.isRead);

            await Promise.all(
                unreadNotifications.map(notif =>
                    updateDoc(doc(db, 'notifications', notif.id), { isRead: true })
                )
            );

            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }, [notifications]);

    const handleDeleteAllNotifications = useCallback(() => {
        setDeleteAllModalVisible(true);
    }, []);

    const confirmDeleteAllNotifications = useCallback(async () => {
                        try {
                            const db = getFirestore(getApp());
                            if (!currentUser) {return;}

                            // Cố gắng lưu thông tin tất cả thông báo đã xóa (có thể fail nếu không có quyền)
                            try {
                                const deleteRecordPromises = notifications.map(notification => {
                                    const deletedNotificationData: any = {
                                        userId: currentUser.uid,
                                        originalNotificationId: notification.id,
                                        notificationType: notification.type,
                                        deletedAt: Timestamp.now(),
                                        title: notification.title,
                                        message: notification.message,
                                    };

                                    // Chỉ thêm relatedId nếu nó tồn tại và không phải undefined
                                    if (notification.relatedId) {
                                        deletedNotificationData.relatedId = notification.relatedId;
                                    }

                                    return addDoc(collection(db, 'deletedNotifications'), deletedNotificationData);
                                });
                                await Promise.all(deleteRecordPromises);
                            } catch (saveError) {
                                console.warn('Cannot save to deletedNotifications (permission issue):', saveError);
                                // Tiếp tục xóa thông báo dù không lưu được vào deletedNotifications
                            }

                            // Xóa tất cả thông báo khỏi database
                            const deletePromises = notifications.map(notification =>
                                deleteDoc(doc(db, 'notifications', notification.id))
                            );

                            await Promise.all(deletePromises);

                            // Cập nhật UI
                            setNotifications([]);
                        } catch (error) {
                            console.error('Error deleting all notifications:', error);
                            Alert.alert('Lỗi', 'Không thể xóa thông báo');
                        } finally {
                            setDeleteAllModalVisible(false);
                        }
    }, [notifications, currentUser]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Thông báo',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontSize: 20,
            },
            headerRight: () => (
                <View style={styles.headerButtonsContainer}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Icon name="done-all" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleDeleteAllNotifications}
                    >
                        <Icon name="delete-sweep" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, handleMarkAllAsRead, handleDeleteAllNotifications]);

    // Dọn dẹp các bản ghi deletedNotifications cũ (>30 ngày)
    const cleanupOldDeletedNotifications = async (db: any, userId: string) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deletedNotificationsRef = collection(db, 'deletedNotifications');
            const oldDeletedQuery = query(
                deletedNotificationsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(oldDeletedQuery);

            const deletePromises: Promise<void>[] = [];
            snapshot.docs.forEach((docItem: { data: () => { (): any; new(): any; deletedAt: { (): any; new(): any; toDate: { (): any; new(): any; }; }; }; id: string; }) => {
                const deletedAt = docItem.data().deletedAt?.toDate();
                if (deletedAt && deletedAt < thirtyDaysAgo) {
                    deletePromises.push(deleteDoc(doc(db, 'deletedNotifications', docItem.id)));
                }
            });

            await Promise.all(deletePromises);
        } catch (error) {
            console.warn('Cannot cleanup deleted notifications (permission issue):', error);
            // Bỏ qua lỗi này vì không ảnh hưởng đến chức năng chính
        }
    };

    const fetchNotifications = useCallback(async (fastMode = false) => {
        if (!currentUser) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const db = getFirestore(getApp());

            // Fast mode: Chỉ lấy thông báo, không tạo mới
            if (!fastMode && !backgroundTasksCompleted) {
                // Chạy các tác vụ nặng song song trong background
                Promise.allSettled([
                    cleanupOldDeletedNotifications(db, currentUser.uid),
                    createDailyWaterReminder(db, currentUser.uid),
                    createUpcomingAppointmentNotifications(db, currentUser.uid),
                    createCompletedAppointmentNotifications(db, currentUser.uid),
                ]).then(() => {
                    setBackgroundTasksCompleted(true);
                    // Reload thông báo ngay sau khi hoàn thành background tasks
                    if (!refreshing) {
                        setTimeout(() => {
                            fetchNotifications(true);
                        }, 500); // Delay ngắn để đảm bảo Firestore đã sync
                    }
                });
            }

            // Lấy thông báo với sắp xếp tối ưu
            const notificationsRef = collection(db, 'notifications');
            const notificationsQuery = query(
                notificationsRef,
                where('userId', '==', currentUser.uid)
                // Không dùng orderBy trong query để tránh lỗi index
            );

            const querySnapshot = await getDocs(notificationsQuery);
            const fetchedNotifications: Notification[] = querySnapshot.docs.map((docSnap: any) => ({
                id: docSnap.id,
                type: docSnap.data().type,
                title: docSnap.data().title,
                message: docSnap.data().message,
                isRead: docSnap.data().isRead || false,
                createdAt: docSnap.data().createdAt,
                relatedId: docSnap.data().relatedId,
            }));

            // Sort nhanh ở client và giới hạn số lượng
            fetchedNotifications.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });

            // Giới hạn 100 thông báo mới nhất để tăng hiệu suất render
            const limitedNotifications = fetchedNotifications.slice(0, 100);
            setNotifications(limitedNotifications);
        } catch (error) {
            console.error('Error fetching notifications: ', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

    // Hàm load nhanh cho lần đầu
    const quickFetchNotifications = useCallback(async () => {
        await fetchNotifications(true); // Bỏ qua các tác vụ tạo thông báo
    }, [fetchNotifications]);

    // Kiểm tra xem thông báo đã bị xóa hay chưa
    const isNotificationDeleted = async (db: any, userId: string, type: string, relatedId?: string, title?: string) => {
        try {
            const deletedNotificationsRef = collection(db, 'deletedNotifications');
            const deletedQuery = query(
                deletedNotificationsRef,
                where('userId', '==', userId),
                where('notificationType', '==', type)
            );

            const snapshot = await getDocs(deletedQuery);

            console.log(`[Debug] Checking deleted notifications for type: ${type}, relatedId: ${relatedId}, title: ${title}`);
            console.log(`[Debug] Found ${snapshot.docs.length} deleted notifications of this type`);

            const isDeleted = snapshot.docs.some((docItem: any) => {
                const data = docItem.data();
                console.log('[Debug] Checking deleted notification:', {
                    type: data.notificationType,
                    relatedId: data.relatedId,
                    title: data.title,
                });

                // Kiểm tra theo relatedId nếu có (ưu tiên cao nhất)
                if (relatedId && data.relatedId) {
                    const match = data.relatedId === relatedId;
                    console.log(`[Debug] RelatedId match: ${match}`);
                    return match;
                }

                // Kiểm tra theo title nếu có (cho reminder)
                if (title && data.title) {
                    const match = data.title === title;
                    console.log(`[Debug] Title match: ${match}`);
                    return match;
                }

                // Fallback: Kiểm tra chung theo type (ít chính xác)
                const match = data.notificationType === type;
                console.log(`[Debug] Type match: ${match}`);
                return match;
            });

            console.log(`[Debug] Final result - isDeleted: ${isDeleted}`);
            return isDeleted;
        } catch (error) {
            console.warn('Cannot access deletedNotifications collection:', error);
            // Nếu không có quyền truy cập, trả về false để cho phép tạo thông báo
            return false;
        }
    };

    // Tạo thông báo nhắc uống nước hàng ngày
    const createDailyWaterReminder = async (db: any, userId: string) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = today.getTime();

            const reminderTitle = 'Nhắc nhở sức khỏe 💧';

            // Kiểm tra xem thông báo reminder đã bị xóa hay chưa
            const isDeleted = await isNotificationDeleted(db, userId, 'reminder', undefined, reminderTitle);
            if (isDeleted) {
                return; // Không tạo lại thông báo đã bị xóa
            }

            const notificationsRef = collection(db, 'notifications');
            const reminderQuery = query(
                notificationsRef,
                where('userId', '==', userId),
                where('type', '==', 'reminder')
            );

            const snapshot = await getDocs(reminderQuery);

            // Kiểm tra xem có thông báo nào hôm nay không (filter ở client)
            const hasReminderToday = snapshot.docs.some((docItem: any) => {
                const createdAt = docItem.data().createdAt?.toDate();
                if (!createdAt) {
                    return false;
                }
                createdAt.setHours(0, 0, 0, 0);
                return createdAt.getTime() === todayTimestamp;
            });

            // Nếu chưa có thông báo nhắc uống nước hôm nay thì tạo mới
            if (!hasReminderToday) {
                await addDoc(notificationsRef, {
                    userId: userId,
                    type: 'reminder',
                    title: reminderTitle,
                    message: 'Đã đến lúc uống nước! Hãy uống ít nhất 2 lít nước mỗi ngày để duy trì sức khỏe tốt nhất.',
                    isRead: false,
                    createdAt: Timestamp.now(),
                });
            }
        } catch (error) {
            console.error('Error creating water reminder:', error);
        }
    };

    // Tạo thông báo cho lịch hẹn sắp tới (trong vòng 24h)
    const createUpcomingAppointmentNotifications = async (db: any, userId: string) => {
        try {
            const appointmentsRef = collection(db, 'appointments');
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Lấy các lịch hẹn của user
            const upcomingQuery = query(
                appointmentsRef,
                where('customerId', '==', userId)
            );

            const appointmentSnapshot = await getDocs(upcomingQuery);

            // Filter ở client: lịch confirmed và trong vòng 24h
            const upcomingAppointments = appointmentSnapshot.docs.filter((docItem: any) => {
                const data = docItem.data();
                if (data.status !== 'confirmed') {
                    return false;
                }
                const apptTime = data.appointmentDateTime?.toDate();
                if (!apptTime) {
                    return false;
                }
                return apptTime >= now && apptTime <= tomorrow;
            });

            // Lấy các thông báo appointment hiện có
            const notificationsRef = collection(db, 'notifications');
            const existingNotifsQuery = query(
                notificationsRef,
                where('userId', '==', userId),
                where('type', '==', 'appointment')
            );
            const existingNotifsSnapshot = await getDocs(existingNotifsQuery);
            const existingRelatedIds = new Set(
                existingNotifsSnapshot.docs.map((docItem: any) => docItem.data().relatedId)
            );

            // Tạo thông báo cho các lịch chưa có thông báo
            for (const appointmentDoc of upcomingAppointments) {
                if (!existingRelatedIds.has(appointmentDoc.id)) {
                    // Kiểm tra xem thông báo cho lịch hẹn này đã bị xóa hay chưa
                    const isDeleted = await isNotificationDeleted(db, userId, 'appointment', appointmentDoc.id);
                    if (isDeleted) {
                        continue; // Bỏ qua việc tạo thông báo đã bị xóa
                    }

                    const appointmentData = appointmentDoc.data();
                    const appointmentDate = appointmentData.appointmentDateTime.toDate();
                    const dateStr = appointmentDate.toLocaleDateString('vi-VN');
                    const timeStr = appointmentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                    await addDoc(notificationsRef, {
                        userId: userId,
                        type: 'appointment',
                        title: 'Lịch hẹn sắp tới 📅',
                        message: `Bạn có lịch khám "${appointmentData.serviceName}" vào ${timeStr} ngày ${dateStr}`,
                        isRead: false,
                        createdAt: Timestamp.now(),
                        relatedId: appointmentDoc.id,
                    });
                }
            }
        } catch (error) {
            console.error('Error creating appointment notifications:', error);
        }
    };

    // Tạo thông báo cho lịch hẹn đã hoàn thành
    const createCompletedAppointmentNotifications = async (db: any, userId: string) => {
        try {
            const appointmentsRef = collection(db, 'appointments');

            // Lấy các lịch hẹn đã hoàn thành của user
            const completedQuery = query(
                appointmentsRef,
                where('customerId', '==', userId),
                where('status', '==', 'completed')
            );

            const completedSnapshot = await getDocs(completedQuery);

            // Lấy các thông báo status hiện có
            const notificationsRef = collection(db, 'notifications');
            const existingNotifsQuery = query(
                notificationsRef,
                where('userId', '==', userId),
                where('type', '==', 'status')
            );
            const existingNotifsSnapshot = await getDocs(existingNotifsQuery);
            const existingRelatedIds = new Set(
                existingNotifsSnapshot.docs.map((docItem: any) => docItem.data().relatedId)
            );

            // Tạo thông báo cho các lịch đã hoàn thành chưa có thông báo
            for (const appointmentDoc of completedSnapshot.docs) {
                if (!existingRelatedIds.has(appointmentDoc.id)) {
                    // Kiểm tra xem thông báo cho lịch hẹn này đã bị xóa hay chưa
                    const isDeleted = await isNotificationDeleted(db, userId, 'status', appointmentDoc.id);
                    if (isDeleted) {
                        continue; // Bỏ qua việc tạo thông báo đã bị xóa
                    }

                    const appointmentData = appointmentDoc.data();
                    const appointmentDate = appointmentData.appointmentDateTime?.toDate();
                    const dateStr = appointmentDate ? appointmentDate.toLocaleDateString('vi-VN') : '';

                    await addDoc(notificationsRef, {
                        userId: userId,
                        type: 'status',
                        title: 'Lịch hẹn đã hoàn thành ✅',
                        message: `Lịch khám "${appointmentData.serviceName}" vào ngày ${dateStr} đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!`,
                        isRead: false,
                        createdAt: Timestamp.now(),
                        relatedId: appointmentDoc.id,
                    });
                }
            }
        } catch (error) {
            console.error('Error creating completed appointment notifications:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            // Lần đầu dùng fast mode để hiển thị nhanh
            fetchNotifications(true);
        }, [fetchNotifications])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setBackgroundTasksCompleted(false);
        // Refresh chạy full mode để cập nhật đầy đủ
        fetchNotifications(false);
    }, [fetchNotifications]);

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'appointment':
                return { name: 'event', color: '#EF4444', bg: '#FEE2E2' };
            case 'status':
                return { name: 'check-circle', color: '#10B981', bg: '#D1FAE5' };
            case 'news':
                return { name: 'article', color: '#3B82F6', bg: '#DBEAFE' };
            case 'reminder':
                return { name: 'notifications', color: '#F59E0B', bg: '#FEF3C7' };
            case 'promotion':
                return { name: 'local-offer', color: '#EC4899', bg: '#FCE7F3' };
            default:
                return { name: 'info', color: '#6B7280', bg: '#F3F4F6' };
        }
    };

    const handleMarkAsRead = useCallback(async (notificationId: string) => {
        try {
            const db = getFirestore(getApp());
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, { isRead: true });

            // Update local state immediately
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    const handleDeleteNotification = useCallback((notificationId: string) => {
        setNotificationToDelete(notificationId);
        setDeleteModalVisible(true);
    }, []);

    const confirmDeleteNotification = useCallback(async () => {
        if (!notificationToDelete) {
            return;
        }

        try {
            const db = getFirestore(getApp());
            const notificationToDeleteObj = notifications.find(n => n.id === notificationToDelete);

            if (notificationToDeleteObj && currentUser) {
                // Cố gắng lưu thông tin thông báo đã xóa (có thể fail nếu không có quyền)
                try {
                    const deletedNotificationData: any = {
                        userId: currentUser.uid,
                        originalNotificationId: notificationToDelete,
                        notificationType: notificationToDeleteObj.type,
                        deletedAt: Timestamp.now(),
                        title: notificationToDeleteObj.title,
                        message: notificationToDeleteObj.message,
                    };

                    // Chỉ thêm relatedId nếu nó tồn tại và không phải undefined
                    if (notificationToDeleteObj.relatedId) {
                        deletedNotificationData.relatedId = notificationToDeleteObj.relatedId;
                    }

                    await addDoc(collection(db, 'deletedNotifications'), deletedNotificationData);
                } catch (saveError) {
                    console.warn('Cannot save to deletedNotifications (permission issue):', saveError);
                    // Tiếp tục xóa thông báo dù không lưu được vào deletedNotifications
                }

                // Xóa thông báo khỏi database
                await deleteDoc(doc(db, 'notifications', notificationToDelete));
            }

            // Cập nhật UI
            setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
        } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Lỗi', 'Không thể xóa thông báo');
        } finally {
            setDeleteModalVisible(false);
            setNotificationToDelete(null);
        }
    }, [notifications, currentUser, notificationToDelete]);

    const handleNotificationPress = useCallback((notification: Notification) => {
        // Mark as read when clicked
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'appointment':
            case 'status':
                if (notification.relatedId) {
                    navigation.navigate('CustomerAppointmentDetail', {
                        appointmentId: notification.relatedId,
                    });
                } else {
                    navigation.navigate('CustomerAppointmentList');
                }
                break;
            case 'news':
                navigation.navigate('HealthNewsTab');
                break;
            case 'promotion':
                // Navigate to Service tab (need to check if exists)
                navigation.navigate('HomeTab');
                break;
        }
    }, [handleMarkAsRead, navigation]);

    const getTimeAgo = useCallback((timestamp: Timestamp) => {
        const now = new Date();
        const notifDate = timestamp.toDate();
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Vừa xong';
        }
        if (diffMins < 60) {
            return `${diffMins} phút trước`;
        }
        if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        }
        if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        }
        return notifDate.toLocaleDateString('vi-VN');
    }, []);

    const filteredNotifications = useMemo(() =>
        notifications.filter(n => filter === 'all' ? true : !n.isRead),
        [notifications, filter]
    );

    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.isRead).length,
        [notifications]
    );

    const renderNotificationItem = useCallback(({ item }: { item: Notification }) => {
        const iconData = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleDeleteNotification(item.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
                    <Icon name={iconData.name} size={24} color={iconData.color} />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, !item.isRead && styles.unreadText]}>
                            {item.title}
                        </Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.message} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNotification(item.id)}
                >
                    <Icon name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    }, [handleNotificationPress, handleDeleteNotification, getTimeAgo]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <Icon name="notifications" size={64} color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải thông báo...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                        Tất cả ({notifications.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
                    onPress={() => setFilter('unread')}
                >
                    <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
                        Chưa đọc ({unreadCount})
                    </Text>
                </TouchableOpacity>
            </View>

            {filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="notifications-none" size={80} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>Không có thông báo</Text>
                    <Text style={styles.emptyText}>
                        {filter === 'unread'
                            ? 'Bạn đã đọc hết tất cả thông báo'
                            : 'Chưa có thông báo nào'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                        />
                    }
                    // Performance optimizations
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    initialNumToRender={15}
                    updateCellsBatchingPeriod={50}
                    getItemLayout={(data, index) => ({
                        length: 88, // Độ cao cố định của mỗi item (80px + 8px margin)
                        offset: 88 * index,
                        index,
                    })}
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="delete" size={48} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Xóa thông báo</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn xóa thông báo này không?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setNotificationToDelete(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteModalButton]}
                                onPress={confirmDeleteNotification}
                            >
                                <Text style={styles.deleteButtonText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete All Modal */}
            <Modal
                visible={deleteAllModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteAllModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModal}>
                        <View style={styles.modalIcon}>
                            <Icon name="delete-sweep" size={48} color="#ff4757" />
                        </View>
                        <Text style={styles.modalTitle}>Xóa tất cả thông báo</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn xóa tất cả thông báo?{'\n'}
                            Hành động này không thể hoàn tác.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setDeleteAllModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteModalButton]}
                                onPress={confirmDeleteAllNotifications}
                            >
                                <Text style={styles.deleteButtonText}>Xóa tất cả</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginRight: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    activeFilterTab: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeFilterText: {
        color: '#FFF',
    },
    listContent: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    unreadItem: {
        backgroundColor: '#FFF',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    unreadText: {
        fontWeight: '700',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    deleteButton: {
        padding: 4,
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModal: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxWidth: 300,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalIcon: {
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    deleteModalButton: {
        backgroundColor: '#ff4757',
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default NotificationScreen;
