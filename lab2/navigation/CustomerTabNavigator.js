/* eslint-disable react/no-unstable-nested-components */
// filepath: navigation/CustomerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, StyleSheet, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
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
            options={{ title: 'Thông báo', headerLeft: undefined }}
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
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 65,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                    marginBottom: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
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
                            <View style={styles.centerButton}>
                                <Icon name="briefcase" size={26} color={COLORS.white} />
                            </View>
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
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        borderWidth: 4,
        borderColor: COLORS.white,
    },
});

export default CustomerTabNavigator;
