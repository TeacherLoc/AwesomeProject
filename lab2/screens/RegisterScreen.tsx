import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS } from '../theme/colors';
import Icon from 'react-native-vector-icons/FontAwesome';

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

        Alert.alert('Thành công', 'Đăng kí tài khoản thành công!');
        navigation.navigate('Login');
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
    <LinearGradient colors={['#fde6e9', '#e6a8b3']} style={styles.linearGradient}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.header} />
          <View style={styles.formContainer}>
            <Image
                          source={require('../assets/logo.png')}
                          style={styles.logo}
                          resizeMode="contain"
                        />
            <View style={styles.inputContainer}>
              <Icon name="user" size={20} color={COLORS.textMedium} style={styles.icon} />
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
              <Icon name="envelope" size={20} color={COLORS.textMedium} style={styles.icon} />
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
              <Icon name="phone" size={20} color={COLORS.textMedium} style={styles.icon} />
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
              <Icon name="lock" size={20} color={COLORS.textMedium} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color={COLORS.textMedium} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={COLORS.textMedium} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor={COLORS.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={20} color={COLORS.textMedium} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                <Text style={styles.buttonText}>Đăng ký</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} style={styles.loginLinkContainer}>
              <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#F4C2C2',
    paddingVertical: 85,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  backButton: {
    position: 'absolute',
    left: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.textDark,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    marginTop: 15,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
   logo: {
    width: 200,
    height: 150,
    marginTop: -10,
  },
});

export default RegisterScreen;
