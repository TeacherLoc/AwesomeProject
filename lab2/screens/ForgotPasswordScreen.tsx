// filepath: screens/Auth/ForgotPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Quên mật khẩu',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon name="lock-reset" size={60} color={COLORS.primary} />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập địa chỉ email đã đăng ký. Nếu được chấp thuận, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        {/* Button */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang gửi yêu cầu...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestPasswordReset}
            activeOpacity={0.8}
          >
            <Icon name="send" size={20} color={COLORS.white} />
            <Text style={styles.buttonText}>Gửi yêu cầu</Text>
          </TouchableOpacity>
        )}

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={loading}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.link}>Quay lại Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textDark,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMedium,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  link: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
