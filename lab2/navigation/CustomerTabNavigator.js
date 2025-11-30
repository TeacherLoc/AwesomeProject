/* eslint-disable react/no-unstable-nested-components */
// filepath: navigation/CustomerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';

// Import Customer Screens
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import CustomerServiceListScreen from '../screens/ServiceListScreen';
import CustomerServiceDetailScreen from '../screens/CustomerServiceDetailScreen';
import CustomerAppointmentScreen from '../screens/CustomerAppointmentScreen';
import CustomerAppointmentListScreen from '../screens/CustomerAppointmentListScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';
import CustomerProfileMenuScreen from '../screens/CustomerProfileMenuScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CustomerAppointmentDetailScreen from '../screens/CustomerAppointmentDetailScreen';
import HealthNewsScreen from '../screens/HealthNewsScreen'; // Import màn hình mới
import ChatbotScreen from '../screens/ChatbotScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ClinicInfoScreen from '../screens/ClinicInfoScreen';
import HealthStatisticsScreen from '../screens/HealthStatisticsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Component Logo cho header
const HeaderLogo = () => (
    <View style={styles.logoContainer}>
        <Image
            source={require('../assets/logo3.png')}
            style={styles.logo}
            resizeMode="contain"
        />
    </View>
);

// Function để render logo (tránh warning về component creation)
const renderHeaderLogo = () => <HeaderLogo />;

// Tùy chọn header mặc định cho các Stack Navigators
const defaultStackScreenOptions = {
    headerStyle: {
        backgroundColor: COLORS.primaryLight,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTintColor: COLORS.primary,
    headerTitleStyle: {
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    headerBackTitleVisible: false,
};

// Stack Navigator for Home Screen
const HomeStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="CustomerHome"
            component={CustomerHomeScreen}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={{ title: 'Thông báo' }}
        />
        <Stack.Screen
            name="CustomerAppointmentDetail"
            component={CustomerAppointmentDetailScreen}
            options={{ title: 'Chi tiết lịch hẹn' }}
        />
        <Stack.Screen
            name="CustomerAppointmentList"
            component={CustomerAppointmentListScreen}
            options={{ title: 'Lịch hẹn của tôi' }}
        />
        <Stack.Screen
            name="ClinicInfo"
            component={ClinicInfoScreen}
            options={{ title: 'Thông tin phòng khám', headerLeft: undefined }}
        />
        <Stack.Screen
            name="HealthStatistics"
            component={HealthStatisticsScreen}
            options={{ title: 'Thống kê sức khỏe', headerLeft: undefined }}
        />
    </Stack.Navigator>
);

// Stack Navigator for Service Browsing/Booking Flow
const ServiceStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="CustomerServiceList"
            component={CustomerServiceListScreen}
            options={{ title: 'Dịch vụ', headerLeft: renderHeaderLogo }}
        />
        <Stack.Screen
            name="CustomerServiceDetail"
            component={CustomerServiceDetailScreen}
            options={{ title: 'Chi tiết dịch vụ', headerLeft: undefined }}
        />
        <Stack.Screen
            name="CustomerBookAppointment"
            component={CustomerAppointmentScreen}
            options={{ title: 'Đặt lịch hẹn', headerLeft: undefined }}
        />
    </Stack.Navigator>
);

// Stack Navigator for Appointment Management Flow
const AppointmentStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="CustomerAppointmentList"
            component={CustomerAppointmentListScreen}
            options={{ title: 'Lịch hẹn của tôi', headerLeft: renderHeaderLogo }}
        />
        <Stack.Screen
            name="CustomerAppointmentDetail"
            component={CustomerAppointmentDetailScreen}
            options={{ title: 'Chi tiết lịch hẹn', headerLeft: undefined }}
        />
    </Stack.Navigator>
);

// Stack Navigator for Profile Management Flow
const ProfileStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="CustomerProfileMenu"
            component={CustomerProfileMenuScreen}
            options={{ title: 'Cá nhân', headerLeft: renderHeaderLogo }}
        />
        <Stack.Screen
            name="CustomerProfile"
            component={CustomerProfileScreen}
            options={{ title: 'Hồ sơ của tôi', headerLeft: undefined }}
        />
        <Stack.Screen
            name="CustomerChangePassword"
            component={ChangePasswordScreen}
            options={{ title: 'Đổi mật khẩu', headerLeft: undefined }}
        />
        <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={{ title: 'Thông báo' }}
        />
        <Stack.Screen
            name="CustomerAppointmentList"
            component={CustomerAppointmentListScreen}
            options={{ title: 'Lịch hẹn của tôi', headerLeft: undefined }}
        />
        <Stack.Screen
            name="CustomerAppointmentDetail"
            component={CustomerAppointmentDetailScreen}
            options={{ title: 'Chi tiết lịch hẹn', headerLeft: undefined }}
        />
    </Stack.Navigator>
);

// Stack Navigator for Chatbot
const ChatbotStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ title: 'Hỗ trợ', headerLeft: renderHeaderLogo }}
        />
    </Stack.Navigator>
);

// Stack Navigator for Health News
const HealthNewsStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen
            name="HealthNews"
            component={HealthNewsScreen}
            options={{ headerLeft: renderHeaderLogo }}
        />
    </Stack.Navigator>
);

const CustomerTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'circle'; // Icon mặc định
                    if (route.name === 'ServicesTab') {
                        return null; // Không hiển thị icon thông thường cho ServicesTab
                    } else if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home';
                    } else if (route.name === 'ChatbotTab') {
                        iconName = focused ? 'comments' : 'comment';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'user-circle' : 'user-circle-o';
                    } else if (route.name === 'HealthNewsTab') {
                        iconName = focused ? 'heartbeat' : 'heartbeat';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#8B5A83',
                tabBarInactiveTintColor: 'rgba(139, 90, 131, 0.6)',
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    paddingTop: 5,
                    paddingBottom: 5,
                    paddingHorizontal: 0,
                    height: 70,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarBackground: () => (
                    <View style={styles.tabBarContainer}>
                        {/* Base glass morphism background */}
                        <LinearGradient
                            colors={['rgba(255, 182, 193, 0.85)', 'rgba(255, 192, 203, 0.8)', 'rgba(255, 218, 225, 0.85)']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.tabBarGlassBg}
                        />
                        
                        {/* Frosted glass overlay */}
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.25)']}
                            start={{x: 0, y: 0}}
                            end={{x: 0, y: 1}}
                            style={styles.tabBarFrostedOverlay}
                        />
                        
                        {/* Subtle shimmer */}
                        <LinearGradient
                            colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.tabBarSubtleShimmer}
                        />
                        
                        {/* Top highlight border */}
                        <View style={styles.tabBarTopHighlight} />
                    </View>
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 2,
                    marginBottom: 6,
                    textShadowColor: 'rgba(255, 255, 255, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 1,
                    letterSpacing: 0.3,
                },
                tabBarIconStyle: {
                    marginTop: 8,
                    marginBottom: 2,
                    shadowColor: 'rgba(255, 255, 255, 0.6)',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.6,
                    shadowRadius: 1,
                },
                headerShown: false, // Stack Navigators sẽ quản lý header
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Trang chủ' }} />
            <Tab.Screen name="ChatbotTab" component={ChatbotStackNavigator} options={{ title: 'Hỗ trợ' }} />
            <Tab.Screen
                name="ServicesTab"
                component={ServiceStackNavigator}
                options={{
                    title: 'Đặt lịch',
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.centerButtonContainer}>
                            <LinearGradient
                                colors={['#E91E63', '#F48FB1', '#F8BBD9']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                                style={styles.centerButton}
                            >
                                <MaterialIcons name="local-florist" size={24} color="#ffffff" />
                            </LinearGradient>
                            <View style={styles.lotusGlow} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen name="HealthNewsTab" component={HealthNewsStackNavigator} options={{ title: 'Tin tức' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá nhân' }} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    logoContainer: {
        marginLeft: 10,
        width: 120,
        height: 40,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    centerButtonContainer: {
        top: -22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    centerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15,
        shadowColor: 'rgba(233, 30, 99, 0.5)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 12,
        borderWidth: 2.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    lotusGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(244, 143, 177, 0.3)',
        top: -7,
        zIndex: -1,
        shadowColor: 'rgba(233, 30, 99, 0.4)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 8,
    },
    // Tab Bar Container Styles
    tabBarContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    tabBarGlassBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        shadowColor: 'rgba(255, 182, 193, 0.3)',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
    },
    tabBarFrostedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        backdropFilter: 'blur(15px)',
    },
    tabBarSubtleShimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        zIndex: 3,
        opacity: 0.7,
    },
    tabBarTopHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        zIndex: 4,
    },
    // Removed floating dots for cleaner rectangle design
});

export default CustomerTabNavigator;
