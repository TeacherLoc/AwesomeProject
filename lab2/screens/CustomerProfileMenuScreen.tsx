/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateDoc } from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

// Custom Header Component với logo và gradient
const CustomHeader = ({ title }: { title: string }) => {
    return (
        <LinearGradient
            colors={['rgba(120, 220, 215, 0.98)', 'rgba(254, 214, 227, 0.9)', 'rgba(255, 236, 210, 0.95)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.customHeader}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={styles.headerContent}>
                <View style={styles.headerCenter}>
                    <Image source={require('../assets/logo3.png')} style={styles.headerLogo} resizeMode="contain" />
                    <Text style={styles.headerTitle}>{title}</Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const CustomerProfileMenuScreen = ({ navigation }: { navigation: any }) => {
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false, // Ẩn header cũ để dùng custom header
        });
    }, [navigation]);

    const { signOut: contextSignOut } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

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
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        try {
            await getAuth().signOut();
            contextSignOut();
        } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Đang tải...</Text>
            </View>
        );
    }

    return (
        <LinearGradient 
            colors={['#a8edea', '#fed6e3', '#ffecd2']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            <CustomHeader title="Cá nhân" />
            <ScrollView style={styles.scrollContent}>
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

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalIconContainer}>
                            <Icon name="logout" size={60} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Đăng xuất</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.modalButtonTextPrimary}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    customHeader: {
        paddingTop: 35,
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogo: {
        width: 28,
        height: 28,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scrollContent: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingBottom: 70, // Để tránh bị che bởi tab bar
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonSecondary: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalButtonPrimary: {
        backgroundColor: '#EF4444',
    },
    modalButtonTextSecondary: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    modalButtonTextPrimary: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default CustomerProfileMenuScreen;
