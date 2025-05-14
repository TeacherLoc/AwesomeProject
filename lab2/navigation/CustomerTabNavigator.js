/* eslint-disable react/no-unstable-nested-components */
// filepath: navigation/CustomerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tùy chọn header mặc định cho các Stack Navigators (giống admin)
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
        <Stack.Screen name="CustomerServiceList" component={CustomerServiceListScreen} options={{ title: 'Dịch vụ' }}/>
        <Stack.Screen name="CustomerServiceDetail" component={CustomerServiceDetailScreen} options={{ title: 'Chi tiết dịch vụ' }}/>
        <Stack.Screen name="CustomerBookAppointment" component={CustomerAppointmentScreen} options={{ title: 'Đặt lịch hẹn' }}/>
    </Stack.Navigator>
);

// Stack Navigator for Appointment Management Flow
const AppointmentStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen name="CustomerAppointmentList" component={CustomerAppointmentListScreen} options={{ title: 'Lịch hẹn của tôi' }}/>
        <Stack.Screen name="CustomerAppointmentDetail" component={CustomerAppointmentDetailScreen} options={{ title: 'Chi tiết lịch hẹn' }}/>
    </Stack.Navigator>
);

// Stack Navigator for Profile Management Flow
const ProfileStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ title: 'Hồ sơ của tôi' }}/>
        <Stack.Screen name="CustomerChangePassword" component={ChangePasswordScreen} options={{ title: 'Đổi mật khẩu' }}/>
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
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá nhân' }} />
            <Tab.Screen
                name="HealthNewsTab"
                component={HealthNewsScreen}
                options={{
                    title: 'Sức Khỏe',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="heartbeat" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default CustomerTabNavigator;
