// filepath: screens/Common/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme/colors';

const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white, // Nền trắng
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textMedium,
    },
});

export default LoadingScreen;
