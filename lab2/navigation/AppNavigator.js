import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Thay đổi import cho auth
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useAuth } from './AuthContext';
import AuthStackNavigator from './AuthStackNavigator';
import AdminTabNavigator from './AdminTabNavigator';
import CustomerTabNavigator from './CustomerTabNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const RootStack = createStackNavigator();

const AppNavigator = () => {
    const { userToken, userRole: contextUserRole, signOut: contextSignOut, isLoading: contextIsLoading } = useAuth();
    const [firebaseAuthChecked, setFirebaseAuthChecked] = useState(false);

    useEffect(() => {
        const authInstance = getAuth(); // Lấy instance của Auth service
        const subscriber = onAuthStateChanged(authInstance, async (firebaseUser) => { // Sử dụng onAuthStateChanged đã import
            if (firebaseUser) {
                // Logic của bạn khi có firebaseUser
            } else {
                // Logic của bạn khi không có firebaseUser
                if (userToken) { // Giữ nguyên logic này nếu cần
                    contextSignOut();
                }
            }
            if (!firebaseAuthChecked) {
                setFirebaseAuthChecked(true);
            }
        });
        return subscriber; // Cleanup subscription on unmount
    }, [userToken, contextSignOut, firebaseAuthChecked]); // Giữ nguyên dependencies nếu chúng vẫn liên quan

    if (contextIsLoading || !firebaseAuthChecked) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {userToken == null ? (
                    <RootStack.Screen name="Auth" component={AuthStackNavigator} />
                ) : contextUserRole === 'admin' ? (
                    <RootStack.Screen name="AdminApp" component={AdminTabNavigator} />
                ) : contextUserRole === 'customer' ? (
                    <RootStack.Screen name="CustomerApp" component={CustomerTabNavigator} />
                ) : (
                    // Fallback, có thể không bao giờ đạt tới nếu logic userRole chặt chẽ
                    <RootStack.Screen name="Auth" component={AuthStackNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
