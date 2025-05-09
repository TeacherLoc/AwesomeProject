import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { COLORS } from '../theme/colors';

const Stack = createStackNavigator();

const AuthStackNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
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
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng nhập' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Tạo tài khoản' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Quên mật khẩu' }} />
        </Stack.Navigator>
    );
};

export default AuthStackNavigator;
