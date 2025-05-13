import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome'; // Or your preferred icon set
import { COLORS } from '../theme/colors'; // Import màu
import AdminServiceListScreen from '../screens/AdminServiceListScreen'; // Import file mới
import AdminAddServiceScreen from '../screens/AddServiceScreen';
import AdminServiceDetailScreen from '../screens/ServiceDetailScreen'; // Màn hình chi tiết/sửa của Admin
import AdminCustomerListScreen from '../screens/CustomerListScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen'; // Pointing to Admin folder
import EditCustomerScreen from '../screens/EditCustomerScreen'; // Corrected path
import AdminPasswordRequestsScreen from '../screens/AdminPasswordRequestsScreen';
import AdminAppointmentListScreen from '../screens/AdminAppointmentListScreen'; // Import màn hình mới
import AdminAppointmentDetailScreen from '../screens/AdminAppointmentDetailScreen'; // Tạo file này nếu chưa có

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

const ServiceStackNavigator = () => ( // Đây là Stack cho Admin
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen
            name="AdminServiceList" // Đổi tên route nếu muốn, hoặc giữ ServiceList
            component={AdminServiceListScreen}
            // options={{ title: 'Quản lý dịch vụ' }} // Tiêu đề đã được set trong AdminServiceListScreen
        />
        <Stack.Screen name="AdminAddService" component={AdminAddServiceScreen} options={{ title: 'Thêm dịch vụ' }}/>
        <Stack.Screen name="AdminServiceDetail" component={AdminServiceDetailScreen} options={{ title: 'Chi tiết dịch vụ' }}/>
    </Stack.Navigator>
);

const ProfileStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ title: 'Profile' }}/>
        <Stack.Screen name="AdminChangePassword" component={ChangePasswordScreen} options={{ title: 'Thay đổi mật khẩu' }}/>
        <Stack.Screen name="AdminPasswordRequests" component={AdminPasswordRequestsScreen} options={{ title: 'Yêu cầu mật khẩu' }} />
    </Stack.Navigator>
);

const CustomerStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen name="AdminCustomerList" component={AdminCustomerListScreen} options={{ title: 'Quản lý khách hàng' }} />
        <Stack.Screen name="EditCustomerScreen" component={EditCustomerScreen} options={{ title: 'Sửa thông tin KH' }} />
    </Stack.Navigator>
);

// const NewsStackNavigator = () => (
//     <Stack.Navigator screenOptions={commonStackScreenOptions}>
//         <Stack.Screen name="AdminNewsScreen" component={AdminNewsScreen} options={{ title: 'Quản lý quá trình' }} />
//     </Stack.Navigator>
// );

const AdminAppointmentStackNavigator = () => (
    <Stack.Navigator screenOptions={commonStackScreenOptions}>
        <Stack.Screen
            name="AdminAppointmentList"
            component={AdminAppointmentListScreen}
            options={{ title: 'Duyệt Lịch Hẹn' }}
        />
        <Stack.Screen
            name="AdminAppointmentDetail" // Màn hình chi tiết lịch hẹn cho admin (nếu cần)
            component={AdminAppointmentDetailScreen} // Bạn cần tạo màn hình này
            options={{ title: 'Chi tiết Lịch Hẹn' }}
        />
        {/* Các màn hình khác liên quan đến lịch hẹn của admin nếu có */}
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
                    } else if (route.name === 'AppointmentsTabAdmin') {
                        iconName = focused ? 'calendar-plus' : 'calendar-plus-o'; // Icon cho tab Lịch Hẹn
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
            {/* <Tab.Screen name="NewsTab" component={NewsStackNavigator} options={{ title: 'Quá trình' }} /> */}
            <Tab.Screen name="CustomersTab" component={CustomerStackNavigator} options={{ title: 'Khách hàng' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Cá nhân' }} />
            <Tab.Screen
                name="AppointmentsTabAdmin" // Đặt tên cho tab
                component={AdminAppointmentStackNavigator} // Sử dụng Stack vừa tạo
                options={{
                    title: 'Lịch Hẹn',
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
};

export default AdminTabNavigator;
