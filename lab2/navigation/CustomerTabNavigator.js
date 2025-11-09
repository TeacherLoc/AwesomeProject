/* eslint-disable react/no-unstable-nested-components */
// filepath: navigation/CustomerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
import { COLORS } from '../theme/colors';

// Import Customer Screens
import CustomerServiceListScreen from '../screens/ServiceListScreen';
import CustomerServiceDetailScreen from '../screens/CustomerServiceDetailScreen';
import CustomerAppointmentScreen from '../screens/CustomerAppointmentScreen';
import CustomerAppointmentListScreen from '../screens/CustomerAppointmentListScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CustomerAppointmentDetailScreen from '../screens/CustomerAppointmentDetailScreen';
import HealthNewsScreen from '../screens/HealthNewsScreen'; // Import màn hình mới
import ChatbotScreen from '../screens/ChatbotScreen';

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
            name="CustomerProfile"
            component={CustomerProfileScreen}
            options={{ title: 'Hồ sơ của tôi', headerLeft: renderHeaderLogo }}
        />
        <Stack.Screen
            name="CustomerChangePassword"
            component={ChangePasswordScreen}
            options={{ title: 'Đổi mật khẩu', headerLeft: undefined }}
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
                        iconName = focused ? 'list-alt' : 'list';
                    } else if (route.name === 'AppointmentsTab') {
                        iconName = focused ? 'calendar-check-o' : 'calendar';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'user-circle' : 'user-circle-o';
                    } else if (route.name === 'HealthNewsTab') {
                        iconName = focused ? 'heartbeat' : 'heartbeat';
                    } else if (route.name === 'ChatbotTab') {
                        iconName = focused ? 'comments' : 'comment';
                    }
                    return <Icon name={iconName} size={size * 0.9} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: 'bold',
                    paddingBottom: 5,
                },
                headerShown: false, // Stack Navigators sẽ quản lý header
            })}
        >
            <Tab.Screen name="ServicesTab" component={ServiceStackNavigator} options={{ title: 'Dịch vụ' }} />
            <Tab.Screen name="AppointmentsTab" component={AppointmentStackNavigator} options={{ title: 'Lịch hẹn' }} />
            <Tab.Screen name="ChatbotTab" component={ChatbotStackNavigator} options={{ title: 'Hỗ trợ' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá nhân' }} />
            <Tab.Screen name="HealthNewsTab" component={HealthNewsStackNavigator} options={{ title: 'Tin tức' }} />
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
});

export default CustomerTabNavigator;
