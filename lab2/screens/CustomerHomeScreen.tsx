import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Alert } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CustomerHomeScreen = ({ navigation }: { navigation: any }) => {
    const [userName, setUserName] = useState('Khách hàng');
    const [unreadCount, setUnreadCount] = useState(0);
    const [avatar, setAvatar] = useState<string | null>(null);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
            fetchUnreadNotificationsCount();
        }, [])
    );

    const loadUserData = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const userDocumentRef = doc(firestoreInstance, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocumentRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUserName(userData?.name || userData?.displayName || 'Khách hàng');
                    if (userData?.avatarBase64) {
                        setAvatar('data:image/jpeg;base64,' + userData.avatarBase64);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data: ', error);
            }
        }
    };

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

    // Quick action buttons data
    const quickActions = [
        {
            id: 1,
            title: 'Thông tin',
            icon: 'info',
            color: '#3B82F6',
            bgColor: '#DBEAFE',
            onPress: () => navigation.navigate('ClinicInfo'),
        },
        {
            id: 2,
            title: 'Lịch hẹn',
            icon: 'calendar-today',
            color: '#3B82F6',
            bgColor: '#DBEAFE',
            onPress: () => navigation.navigate('ProfileTab', {
                screen: 'CustomerProfileMenu',
            }),
        },
        {
            id: 3,
            title: 'Tin tức',
            icon: 'article',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            onPress: () => navigation.navigate('HealthNewsTab'),
        },
        {
            id: 4,
            title: 'Hỗ trợ',
            icon: 'support-agent',
            color: '#EC4899',
            bgColor: '#FCE7F3',
            onPress: () => navigation.navigate('ChatbotTab'),
        },
    ];

    // Featured services
    const featuredServices = [
        {
            id: 1,
            title: 'Dịch vụ khám bệnh',
            icon: 'medical-services',
            color: '#EF4444',
            bgColor: '#FEE2E2',
            onPress: () => navigation.navigate('ServicesTab'),
        },
        {
            id: 3,
            title: 'Hỗ trợ trực tuyến',
            icon: 'chat',
            color: '#10B981',
            bgColor: '#D1FAE5',
            onPress: () => navigation.navigate('ChatbotTab'),
        },
        {
            id: 4,
            title: 'Hotline',
            icon: 'phone',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            onPress: () => {
                const phoneNumber = '0911550316';
                Alert.alert(
                    'Gọi hotline',
                    `Bạn muốn gọi đến số ${phoneNumber}?`,
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Gọi',
                            onPress: () => {
                                Linking.openURL(`tel:${phoneNumber}`).catch(_err => {
                                    Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
                                });
                            },
                        },
                    ]
                );
            },
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.userInfo}>
                        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Icon name="person" size={24} color={COLORS.primary} />
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.greeting}>
                            <Text style={styles.greetingText}>Xin chào,</Text>
                            <Text style={styles.userName}>{userName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('ProfileTab', { screen: 'NotificationScreen' })}
                    >
                        <Icon name="notifications-none" size={28} color="#FFF" />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Health Info Card */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsLeft}>
                        <Icon name="event-available" size={32} color="#10B981" />
                        <View style={styles.pointsInfo}>
                            <Text style={styles.pointsLabel}>Lịch hẹn sắp tới</Text>
                            <Text style={styles.pointsValue}>Chưa có lịch</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => navigation.navigate('ServicesTab')}
                    >
                        <Text style={styles.historyButtonText}>Đặt lịch</Text>
                        <Icon name="chevron-right" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.quickActionItem}
                            onPress={action.onPress}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                                <Icon name={action.icon} size={28} color={action.color} />
                            </View>
                            <Text style={styles.quickActionText}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Featured Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>
                    <View style={styles.featuredGrid}>
                        {featuredServices.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.featuredCard, { backgroundColor: service.bgColor }]}
                                onPress={service.onPress}
                            >
                                <Icon name={service.icon} size={32} color={service.color} />
                                <Text style={[styles.featuredCardText, { color: service.color }]}>
                                    {service.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* News Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tin tức y tế</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('HealthNewsTab')}>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.newsCard}
                        onPress={() => navigation.navigate('HealthNewsTab')}
                    >
                        <Image
                            source={require('../assets/logo3.png')}
                            style={styles.newsImage}
                            resizeMode="cover"
                        />
                        <View style={styles.newsOverlay}>
                            <Text style={styles.newsTitle}>Khám phá các dịch vụ y tế chất lượng cao</Text>
                            <Text style={styles.newsSubtitle}>Đặt lịch ngay hôm nay</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        backgroundColor: '#6366F1',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    greeting: {
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    notificationBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    pointsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    pointsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointsInfo: {
        marginLeft: 12,
    },
    pointsLabel: {
        fontSize: 13,
        color: '#FFF',
        opacity: 0.95,
    },
    pointsValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    historyButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    content: {
        flex: 1,
    },
    quickActionsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: -10,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    quickActionItem: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        color: COLORS.textDark,
        textAlign: 'center',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 20,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    featuredGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featuredCard: {
        width: (width - 44) / 2,
        height: 120,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredCardText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    newsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 180,
        marginBottom: 24,
    },
    newsImage: {
        width: '100%',
        height: '100%',
    },
    newsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    newsSubtitle: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    bottomSpacing: {
        height: 20,
    },
});

export default CustomerHomeScreen;
