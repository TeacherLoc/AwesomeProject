/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateDoc } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const CustomerProfileMenuScreen = ({ navigation }: { navigation: any }) => {
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Cá nhân',
            headerTitleAlign: 'center',
            headerTitleStyle: {
                fontSize: 20,
            },
        });
    }, [navigation]);

    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadUserProfile();
    }, []);

    // Lấy số thông báo chưa đọc khi màn hình được focus
    useFocusEffect(
        React.useCallback(() => {
            fetchUnreadNotificationsCount();
        }, [])
    );

    const fetchUnreadNotificationsCount = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const notificationsRef = collection(firestoreInstance, 'notifications');
                const unreadQuery = query(
                    notificationsRef,
                    where('userId', '==', currentUser.uid),
                    where('isRead', '==', false)
                );

                const querySnapshot = await getDocs(unreadQuery);
                setUnreadCount(querySnapshot.size);
            } catch (error) {
                console.error('Error fetching unread notifications count: ', error);
                setUnreadCount(0);
            }
        }
    };

    const loadUserProfile = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setProfile(userData);
                    if (userData?.avatarBase64) {
                        setAvatar('data:image/jpeg;base64,' + userData.avatarBase64);
                    } else {
                        setAvatar(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile: ', error);
            }
        }
        setLoading(false);
    };

    const handleChangeAvatar = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 1, includeBase64: true }, async (response) => {
            if (response.didCancel) {return;}
            if (response.errorCode) {
                Alert.alert('Lỗi', 'Không thể chọn ảnh');
                return;
            }
            const asset = response.assets && response.assets[0];
            if (asset?.base64) {
                try {
                    const authInstance = getAuth();
                    const currentUser = authInstance.currentUser;
                    if (!currentUser) {return;}

                    setAvatar('data:image/jpeg;base64,' + asset.base64);

                    const firestoreInstance = getFirestore();
                    const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                    await updateDoc(userDocumentRef, { avatarBase64: asset.base64 });

                    Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
                } catch (error) {
                    console.error('Lỗi lưu ảnh:', error);
                    Alert.alert('Lỗi', 'Không thể lưu ảnh đại diện');
                }
            }
        });
    };

    const handleSignOut = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await getAuth().signOut();
                            contextSignOut();
                        } catch (error) {
                            console.error('Sign out error:', error);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header Card với Avatar và Thông tin */}
            <View style={styles.headerCard}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}>
                    <Image
                        source={avatar ? { uri: avatar } : require('../assets/lo.png')}
                        style={styles.avatar}
                    />
                    <View style={styles.avatarEditBadge}>
                        <Icon name="camera-alt" size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.userName}>{profile?.name || 'Người dùng'}</Text>
                    <Text style={styles.userPhone}>{profile?.phone || profile?.email || ''}</Text>
                    <Text style={styles.userDate}>📅 {new Date().toLocaleDateString('vi-VN')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => navigation.navigate('CustomerProfile')}
                >
                    <Icon name="edit" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Câu châm ngôn về sức khỏe */}
            <View style={styles.quoteCard}>
                <View style={styles.quoteIconContainer}>
                    <Icon name="favorite" size={24} color="#E91E63" />
                </View>
                <View style={styles.quoteTextContainer}>
                    <Text style={styles.quoteText}>
                        "Sức khỏe không phải là tất cả, nhưng không có sức khỏe thì tất cả đều không có gì"
                    </Text>
                    <Text style={styles.quoteAuthor}>- Arthur Schopenhauer</Text>
                </View>
            </View>

            {/* Tính năng */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tính năng</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('CustomerAppointmentList')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Icon name="calendar-today" size={22} color="#EF4444" />
                        </View>
                        <Text style={styles.menuItemText}>Lịch hẹn khám</Text>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ServicesTab')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#DBEAFE' }]}>
                            <Icon name="medical-services" size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.menuItemText}>Dịch vụ y tế</Text>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('HealthNewsTab')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#D1FAE5' }]}>
                            <Icon name="article" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.menuItemText}>Tin tức sức khỏe</Text>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tài khoản */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tài khoản</Text>
                <View style={styles.menuCard}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('CustomerProfile')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primaryLight }]}>
                            <Icon name="person" size={22} color={COLORS.primary} />
                        </View>
                        <Text style={styles.menuItemText}>Thông tin cá nhân</Text>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('CustomerChangePassword')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#FEF3C7' }]}>
                            <Icon name="lock-outline" size={22} color="#F59E0B" />
                        </View>
                        <Text style={styles.menuItemText}>Bảo mật</Text>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('NotificationScreen')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#E0E7FF' }]}>
                            <Icon name="notifications-none" size={22} color="#6366F1" />
                        </View>
                        <Text style={styles.menuItemText}>Thông báo</Text>
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Nút Đăng xuất */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                <Icon name="logout" size={20} color="#FFF" />
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
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
    },
    headerCard: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 20,
        paddingVertical: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366F1',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 2,
    },
    userDate: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.8,
    },
    editIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quoteCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: -20,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    quoteIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quoteTextContainer: {
        flex: 1,
    },
    quoteText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    quoteAuthor: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 20,
        marginBottom: 12,
    },
    menuCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 68,
    },
    notificationBadge: {
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginRight: 8,
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        gap: 8,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default CustomerProfileMenuScreen;
