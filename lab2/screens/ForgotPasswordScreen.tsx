// filepath: screens/Auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors'; // Import COLORS

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email của bạn.');
        return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ.');
        return;
    }

    setLoading(true);
    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert('Kiểm tra email của bạn', 'Một liên kết đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn.');
      navigation.goBack();
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Lỗi', 'Không tìm thấy người dùng với địa chỉ email này.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ!');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Lỗi', 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
      }
      else {
        Alert.alert('Lỗi', `Không thể gửi email đặt lại mật khẩu: ${error.message}`);
      }
      console.error('Forgot Password Error: ', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập địa chỉ email của bạn dưới đây để nhận hướng dẫn đặt lại mật khẩu.</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập email của bạn"
        placeholderTextColor={COLORS.textLight}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
          <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} style={styles.backButton}>
        <Text style={styles.link}>Quay lại Đăng nhập</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight, // Changed background color
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.textDark, // Changed title color
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14, // Adjusted font size
        color: COLORS.textMedium, // Changed subtitle color
        textAlign: 'center',
        marginBottom: 30, // Increased margin
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border, // Changed border color
        borderRadius: 8,
        marginBottom: 20, // Increased margin
        paddingHorizontal: 15,
        paddingVertical: 12,
        width: '100%',
        height: 50,
        fontSize: 16,
        backgroundColor: COLORS.white, // Added background for input
        color: COLORS.textDark, // Changed text color
    },
    button: {
        backgroundColor: COLORS.primary, // Changed button background color
        paddingVertical: 15, // Adjusted padding
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white, // Changed button text color
        fontSize: 16,
        fontWeight: 'bold',
    },
    link: {
        color: COLORS.primary, // Changed link color
        fontSize: 14,
    },
    loader: {
        marginTop: 20, // Adjusted margin
    },
    backButton: { // Added style for the back button for better touch area and spacing
        marginTop: 20,
        padding: 10, // Add some padding for easier touch
    }});

export default ForgotPasswordScreen;
