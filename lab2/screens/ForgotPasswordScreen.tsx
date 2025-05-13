// filepath: screens/Auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestPasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
        Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email của bạn.');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ.');
        return;
    }

    setLoading(true);
    try {
      // Bỏ qua việc kiểm tra 'users' collection từ client.
      // Chỉ tạo yêu cầu với email người dùng nhập vào.
      // Admin sẽ là người xác minh email này khi duyệt.
      await firestore().collection('passwordResetRequests').add({
        userEmail: trimmedEmail, // Chỉ lưu email
        status: 'pending',
        requestTimestamp: firestore.FieldValue.serverTimestamp(),
        // Không cần userId hay userName ở bước này từ client
      });

      Alert.alert(
        'Yêu cầu đã được gửi',
        'Yêu cầu đặt lại mật khẩu của bạn đã được gửi đến quản trị viên. Bạn sẽ nhận được email hướng dẫn nếu yêu cầu được chấp thuận.'
      );
      navigation.goBack(); // Hoặc điều hướng đến màn hình chờ nếu bạn muốn làm phức tạp hơn

    } catch (error: any) {
      console.error('Forgot Password Request Error: ', error);
      if (error.code === 'firestore/permission-denied') {
          Alert.alert('Lỗi', 'Không có quyền gửi yêu cầu. Vui lòng kiểm tra lại cài đặt Firestore Rules.');
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert('Lỗi', 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.');
      } else {
        Alert.alert('Lỗi', `Đã xảy ra lỗi khi gửi yêu cầu: ${error.message}`);
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập địa chỉ email đã đăng ký. Nếu được chấp thuận, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleRequestPasswordReset} disabled={loading}>
          <Text style={styles.buttonText}>Gửi yêu cầu</Text>
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
        backgroundColor: COLORS.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMedium,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 15,
        paddingVertical: 12,
        width: '100%',
        height: 50,
        fontSize: 16,
        backgroundColor: COLORS.white,
        color: COLORS.textDark,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    link: {
        color: COLORS.primary,
        fontSize: 14,
    },
    loader: {
        marginTop: 20,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
    }});

export default ForgotPasswordScreen;
