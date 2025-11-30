import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Linking, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CustomerHomeScreen = ({ navigation }: { navigation: any }) => {
    const [userName, setUserName] = useState('Khách hàng');
    const [unreadCount, setUnreadCount] = useState(0);
    const [confirmedAppointmentsCount, setConfirmedAppointmentsCount] = useState(0);
    const [completedAppointmentsCount, setCompletedAppointmentsCount] = useState(0);
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
            fetchConfirmedAppointmentsCount();
            fetchCompletedAppointmentsCount();
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

    const fetchConfirmedAppointmentsCount = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const appointmentsRef = collection(firestoreInstance, 'appointments');
                const confirmedQuery = query(
                    appointmentsRef,
                    where('customerId', '==', currentUser.uid),
                    where('status', '==', 'confirmed')
                );

                const querySnapshot = await getDocs(confirmedQuery);
                setConfirmedAppointmentsCount(querySnapshot.size);
            } catch (error) {
                console.error('Error fetching confirmed appointments count: ', error);
                setConfirmedAppointmentsCount(0);
            }
        }
    };

    const fetchCompletedAppointmentsCount = async () => {
        const authInstance = getAuth();
        const currentUser = authInstance.currentUser;

        if (currentUser) {
            try {
                const firestoreInstance = getFirestore();
                const appointmentsRef = collection(firestoreInstance, 'appointments');
                const completedQuery = query(
                    appointmentsRef,
                    where('customerId', '==', currentUser.uid),
                    where('status', '==', 'completed')
                );

                const querySnapshot = await getDocs(completedQuery);
                setCompletedAppointmentsCount(querySnapshot.size);
            } catch (error) {
                console.error('Error fetching completed appointments count: ', error);
                setCompletedAppointmentsCount(0);
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
            badge: confirmedAppointmentsCount,
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
            title: 'Thống kê sức khỏe',
            icon: 'bar-chart',
            color: '#F59E0B',
            bgColor: '#FEF3C7',
            onPress: () => {
                navigation.navigate('HealthStatistics');
            },
        },
    ];

    return (
        <LinearGradient 
            colors={['#a8edea', '#fed6e3', '#ffecd2']} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
            style={styles.container}
        >
            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
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
                        onPress={() => navigation.navigate('NotificationScreen')}
                    >
                        <Icon name="notifications-none" size={28} color="#4a5568" />
                        {unreadCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Hotline Card */}
                <View style={styles.pointsCard}>
                    <View style={styles.pointsLeft}>
                        <Icon name="phone" size={32} color="#EF4444" />
                        <View style={styles.pointsInfo}>
                            <Text style={styles.pointsLabel}>Hotline hỗ trợ 24/7</Text>
                            <Text style={styles.pointsValue}>0911 550 316</Text>
                            <Text style={styles.appointmentHint}>
                                Bấm để gọi ngay! ☎️
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => {
                            Linking.openURL('tel:0911550316').catch((_err) =>
                                Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi')
                            );
                        }}
                    >
                        <Text style={styles.historyButtonText}>Gọi ngay</Text>
                        <Icon name="phone-in-talk" size={18} color="#2d3748" />
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
                                {action.badge !== undefined && action.badge > 0 && (
                                    <View style={styles.quickActionBadge}>
                                        <Text style={styles.quickActionBadgeText}>
                                            {action.badge > 99 ? '99+' : action.badge}
                                        </Text>
                                    </View>
                                )}
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
                                {service.id === 4 && (
                                    <Text style={styles.featuredSubtext}>
                                        {completedAppointmentsCount} lần khám
                                    </Text>
                                )}
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
                            <Text style={styles.newsSubtitle}>Xem ngay</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: 100,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        opacity: 0.7,
    },
    decorativeCircle2: {
        position: 'absolute',
        top: 300,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        opacity: 0.6,
    },
    decorativeCircle3: {
        position: 'absolute',
        bottom: 200,
        right: -60,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        opacity: 0.8,
    },
    header: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(15px)',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.6)',
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
        color: '#4a5568',
        opacity: 0.8,
        fontWeight: '500',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748',
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
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        elevation: 3,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        color: '#4a5568',
        opacity: 0.9,
        fontWeight: '500',
    },
    pointsValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
    },
    appointmentHint: {
        fontSize: 11,
        color: '#718096',
        marginTop: 4,
        fontStyle: 'italic',
        fontWeight: '400',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        elevation: 2,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    historyButtonText: {
        color: '#2d3748',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    content: {
        flex: 1,
        paddingBottom: 20, // Giảm padding để loại bỏ khoảng trắng thừa
    },
    quickActionsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 25,
        marginHorizontal: 16,
        marginTop: -10,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-around',
        elevation: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
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
        position: 'relative',
    },
    quickActionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    quickActionBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    quickActionText: {
        fontSize: 12,
        color: '#4a5568',
        textAlign: 'center',
        fontWeight: '600',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 20,
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    seeAllText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    featuredGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featuredCard: {
        width: (width - 44) / 2,
        height: 130,
        borderRadius: 20,
        padding: 18,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        elevation: 6,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    featuredBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    featuredBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    featuredCardText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    featuredSubtext: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
        opacity: 0.8,
    },
    newsCard: {
        borderRadius: 20,
        overflow: 'hidden',
        height: 190,
        marginBottom: 24,
        elevation: 8,
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
        backgroundColor: 'rgba(45, 55, 72, 0.85)',
        padding: 20,
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
        height: 10,
    },
});

export default CustomerHomeScreen;
