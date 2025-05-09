// filepath: navigation/CustomerTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
import { COLORS } from '../theme/colors'; // Thêm import COLORS

// Import Customer Screens
import CustomerServiceListScreen from '../screens/ServiceListScreen';
import CustomerServiceDetailScreen from '../screens/ServiceDetailScreen';
import CustomerAppointmentScreen from '../screens/AppointmentScreen'; // Booking screen
import CustomerAppointmentListScreen from '../screens/AppointmentListScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen'; // Assuming a shared or customer-specific one

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tùy chọn header mặc định cho các Stack Navigators
const defaultStackScreenOptions = {
    headerStyle: {
        backgroundColor: COLORS.primaryLight, // Nền header màu hồng nhạt
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // Hoặc một màu hồng đậm hơn nhẹ nhàng
    },
    headerTintColor: COLORS.primary, // Màu nút back
    headerTitleStyle: {
        fontWeight: 'bold',
        color: COLORS.textDark, // Màu tiêu đề
    },
    headerBackTitleVisible: false,
};

// Stack Navigator for Service Browsing/Booking Flow
const ServiceStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen name="CustomerServiceList" component={CustomerServiceListScreen} options={{ title: 'Services' }}/>
        <Stack.Screen name="CustomerServiceDetail" component={CustomerServiceDetailScreen} options={{ title: 'Service Details' }}/>
        <Stack.Screen name="CustomerBookAppointment" component={CustomerAppointmentScreen} options={{ title: 'Book Appointment' }}/>
        {/* Add Update Appointment screen if needed within this flow or Appointments flow */}
    </Stack.Navigator>
);

// Stack Navigator for Appointment Management Flow
const AppointmentStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen name="CustomerAppointmentList" component={CustomerAppointmentListScreen} options={{ title: 'My Appointments' }}/>
        {/* Add Update/Delete Appointment screens here, potentially reusing AppointmentScreen */}
        {/* Example: <Stack.Screen name="CustomerUpdateAppointment" component={CustomerAppointmentScreen} options={{ title: 'Update Appointment' }}/> */}
    </Stack.Navigator>
);

// Stack Navigator for Profile Management Flow
const ProfileStackNavigator = () => (
    <Stack.Navigator screenOptions={defaultStackScreenOptions}>
        <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ title: 'My Profile' }}/>
        <Stack.Screen name="CustomerChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }}/>
    </Stack.Navigator>
);

const CustomerTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'circle'; // Giữ nguyên icon mặc định hoặc logic chọn icon của bạn
                    if (route.name === 'ServicesTab') {
                        iconName = focused ? 'cutlery' : 'cutlery'; // Giữ nguyên icon của bạn
                    } else if (route.name === 'AppointmentsTab') {
                        iconName = focused ? 'calendar-check-o' : 'calendar'; // Giữ nguyên icon của bạn
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'user' : 'user-o'; // Giữ nguyên icon của bạn
                    }
                    return <Icon name={iconName} size={size*0.9} color={color} />; // Giảm nhẹ size icon nếu cần
                },
                tabBarActiveTintColor: COLORS.primary, // Áp dụng màu chủ đạo
                tabBarInactiveTintColor: COLORS.textLight, // Áp dụng màu cho tab không active
                tabBarStyle: { // Thêm style cho tab bar
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: { // Thêm style cho label
                    fontSize: 10,
                    fontWeight: 'bold',
                    paddingBottom: 5,
                },
                headerShown: false, // Giữ nguyên: Stack Navigators quản lý header
            })}
        >
            <Tab.Screen name="ServicesTab" component={ServiceStackNavigator} options={{ title: 'Services' }} />
            <Tab.Screen name="AppointmentsTab" component={AppointmentStackNavigator} options={{ title: 'Appointments' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
};

export default CustomerTabNavigator;