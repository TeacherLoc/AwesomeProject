import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
import { COLORS } from '../theme/colors'; // Import màu
import AdminServiceListScreen from '../screens/ServiceListScreen';
import AdminAddServiceScreen from '../screens/AddServiceScreen';
import AdminServiceDetailScreen from '../screens/ServiceDetailScreen';
import AdminTransactionListScreen from '../screens/TransactionListScreen';
import AdminCustomerListScreen from '../screens/CustomerListScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen'; // Pointing to Admin folder

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const commonStackScreenOptions = {
    headerStyle: {
        backgroundColor: COLORS.primaryLight, // Nền header màu hồng nhạt
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTintColor: COLORS.primary, // Màu nút back
    headerTitleStyle: {
        color: COLORS.textDark, // Màu tiêu đề
        fontWeight: 'bold',
    },
    headerBackTitleVisible: false,
};

const ServiceStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminServiceList" component={AdminServiceListScreen} options={{ title: 'Quản lý dịch vụ' }}/>
        <Stack.Screen name="AdminAddService" component={AdminAddServiceScreen} options={{ title: 'Thêm dịch vụ' }}/>
        <Stack.Screen name="AdminServiceDetail" component={AdminServiceDetailScreen} options={{ title: 'Chi tiết dịch vụ' }}/>
    </Stack.Navigator>
);

const ProfileStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ title: 'Profile' }}/>
        <Stack.Screen name="AdminChangePassword" component={ChangePasswordScreen} options={{ title: 'Thay đổi mật khẩu' }}/>
    </Stack.Navigator>
);

const CustomerStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminCustomerList" component={AdminCustomerListScreen} options={{ title: 'Quản lý khách hàng' }} />
    </Stack.Navigator>
);

const TransactionStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminTransactionList" component={AdminTransactionListScreen} options={{ title: 'Quản lý quá trình' }} />
    </Stack.Navigator>
);

const AdminTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                // eslint-disable-next-line react/no-unstable-nested-components
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'question-circle'; // Icon mặc định
                    if (route.name === 'ServicesTab') {
                        iconName = focused ? 'list-alt' : 'list';
                    } else if (route.name === 'TransactionsTab') {
                        iconName = focused ? 'calendar-check-o' : 'calendar'; // Giữ nguyên icon bạn đã chọn
                    } else if (route.name === 'CustomersTab') {
                        iconName = focused ? 'users' : 'users'; // Giữ nguyên icon bạn đã chọn
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'user-circle' : 'user-circle-o';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary, // Cập nhật màu active
                tabBarInactiveTintColor: COLORS.textLight, // Cập nhật màu inactive
                headerShown: false,
            })}
            tabBarOptions={{
                activeTintColor: COLORS.primary,
                inactiveTintColor: COLORS.textLight,
                labelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                style: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                },
                showIcon: true,
            }}
        >
            <Tab.Screen name="ServicesTab" component={ServiceStackNavigator} options={{ title: 'Dịch vụ' }} />
            <Tab.Screen name="TransactionsTab" component={TransactionStackNavigator} options={{ title: 'Quá trình' }} />
            <Tab.Screen name="CustomersTab" component={CustomerStackNavigator} options={{ title: 'Khách hàng' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá nhân' }} />
        </Tab.Navigator>
    );
};

export default AdminTabNavigator;
