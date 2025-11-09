// filepath: screens/Common/LoadingScreen.tsx
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../theme/colors';

const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo3.png')}
                style={styles.logo}
            />
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
    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
});

export default LoadingScreen;
