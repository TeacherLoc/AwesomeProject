import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Validation functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidName = (name: string): boolean => {
  const nameRegex = /^[^\d]+$/;
  return nameRegex.test(name);
};

const hasNumber = (password: string): boolean => {
  const numberRegex = /\d/;
  return numberRegex.test(password);
};

const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Tạo tài khoản',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    if (!isValidName(trimmedName)) {
      Alert.alert('Lỗi', 'Họ tên không được chứa chữ số.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (!hasNumber(password)) {
      Alert.alert('Lỗi', 'Mật khẩu phải chứa ít nhất một chữ số.');
      return;
    }

    setLoading(true);
    try {
      const userCredential: FirebaseAuthTypes.UserCredential = await auth().createUserWithEmailAndPassword(trimmedEmail, password);
      const user = userCredential.user;

      if (user) {
        await user.updateProfile({
          displayName: trimmedName,
        });

        const userData = {
          uid: user.uid,
          name: trimmedName,
          email: user.email,
          phone: phone.trim(),
          role: 'customer',
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        await firestore().collection('users').doc(user.uid).set(userData);

        setShowSuccessModal(true);
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Lỗi', 'Email đã có người sử dụng!');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Lỗi', 'Email không hợp lệ!');
      } else {
        Alert.alert('Lỗi', `Đăng kí thất bại: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Icon name="person-add" size={60} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>
            Điền thông tin để tạo tài khoản HealthCare của bạn
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Icon name="person" size={20} color={COLORS.textMedium} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và Tên"
              placeholderTextColor={COLORS.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={COLORS.textMedium} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color={COLORS.textMedium} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại (Không bắt buộc)"
              placeholderTextColor={COLORS.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.textMedium} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={COLORS.textMedium} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={COLORS.textMedium} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={COLORS.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Icon name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={20} color={COLORS.textMedium} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tạo tài khoản...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}>
              <Icon name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Đăng ký</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.backButton}>
            <Icon name="arrow-back" size={18} color={COLORS.primary} />
            <Text style={styles.backText}>Đã có tài khoản? Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('Login');
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={80} color="#4CAF50" />
            <Text style={styles.modalTitle}>Thành công!</Text>
            <Text style={styles.modalMessage}>
              Tài khoản của bạn đã được tạo thành công.{'\n'}
              Bạn có thể đăng nhập ngay bây giờ.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('Login');
              }}>
              <Text style={styles.modalButtonText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
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
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.textDark,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMedium,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 6,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textMedium,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    elevation: 2,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RegisterScreen;
