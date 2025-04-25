import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ContactsScreen from '../screens/ContactsScreen';
import ContactDetailScreen from '../screens/ContactDetailScreen';
import AddContactScreen from '../screens/AddContactScreen'; // Import màn hình mới

const Stack = createStackNavigator();

const ContactsStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {},
                headerTintColor: '#000',
                headerTitleStyle: {},
                headerBackTitleVisible: false,
            }}
        >
            <Stack.Screen
                name="ContactsList"
                component={ContactsScreen}
                // options={{ title: 'Danh bạ' }} // Tiêu đề đặt trong ContactsScreen
            />
            <Stack.Screen
                name="ContactDetail"
                component={ContactDetailScreen}
            />
            {/* Thêm AddContactScreen vào Stack */}
            <Stack.Screen
                name="AddContact"
                component={AddContactScreen}
                options={{ title: 'Thêm liên hệ mới' }} // Đặt tiêu đề cho màn hình thêm
            />
        </Stack.Navigator>
    );
};

export default ContactsStackNavigator;
