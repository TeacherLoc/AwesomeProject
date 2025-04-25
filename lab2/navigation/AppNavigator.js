import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, Text } from 'react-native'; // Import View, Text

// Import các màn hình/stack
import ChatScreen from '../screens/ChatScreen';
import StoreScreen from '../screens/StoreScreen';
import ContactsStackNavigator from './ContactsStackNavigator'; // Import Stack mới

// Import các màn hình khác nếu có
// import CallsScreen from '../screens/CallsScreen';
// import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Component tạm thời cho các tab chưa làm
const PlaceholderScreen = ({ route }) => ( // Nhận route để hiển thị tên
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Màn hình {route.name} - Coming Soon</Text>
    </View>
);

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Chat') {
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                        } else if (route.name === 'Store') {
                            iconName = focused ? 'cart' : 'cart-outline';
                        } else if (route.name === 'Calls') {
                            iconName = focused ? 'call' : 'call-outline';
                        } else if (route.name === 'Contacts') { // Icon cho tab Contacts
                            iconName = focused ? 'people' : 'people-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }

                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: 'tomato',
                    tabBarInactiveTintColor: 'gray',
                    // Quan trọng: Ẩn header của Tab Navigator cho Stack
                    // để Stack Navigator bên trong tự quản lý header của nó
                    headerShown: false,
                })}
            >
                <Tab.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{ headerShown: true, title: 'Chat' }} // Hiện lại header cho màn Chat
                />
                <Tab.Screen
                    name="Calls"
                    component={PlaceholderScreen}
                    options={{ headerShown: true, title: 'Cuộc gọi' }} // Hiện header cho màn Placeholder
                />
                 <Tab.Screen
                    name="Store"
                    component={StoreScreen}
                    options={{ headerShown: true, title: 'Cửa hàng' }} // Hiện lại header cho màn Store
                />
                {/* Sử dụng ContactsStackNavigator cho tab Contacts */}
                <Tab.Screen name="Contacts" component={ContactsStackNavigator} />
                <Tab.Screen
                    name="Settings"
                    component={PlaceholderScreen}
                    options={{ headerShown: true, title: 'Cài đặt' }} // Hiện header cho màn Placeholder
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;