import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// Firebase Auth for React Native
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// Firebase Firestore for React Native
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';
import Config from '../config/env.config';

// Hàm kiểm tra định dạng email đơn giản
const isValidEmail = (email: string): boolean => {
  // Biểu thức chính quy cơ bản để kiểm tra email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_WEB_CLIENT_ID, // Lấy từ file config
      offlineAccess: true, // Cho phép offline access
      hostedDomain: '', // Để trống nếu không giới hạn domain
      forceCodeForRefreshToken: true, // Bắt buộc code để refresh token
    });
  }, []);

  // Đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Kiểm tra Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Đăng nhập Google và lấy thông tin người dùng
      const userInfo = await GoogleSignin.signIn();

      console.log('Google Sign-In Response:', userInfo);

      // Lấy idToken từ userInfo
      let idToken = userInfo.data?.idToken;

      if (!idToken) {
        // Thử lấy từ getTokens nếu không có trong userInfo
        console.log('Trying to get tokens after sign in...');
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        throw new Error('Không thể lấy ID token từ Google');
      }

      console.log('Google Sign-In Success, proceeding with Firebase auth');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      const userCredential = await auth().signInWithCredential(googleCredential);

      if (userCredential.user) {
        const userDocumentRef = firestore().collection('users').doc(userCredential.user.uid);
        const userDocSnap = await userDocumentRef.get();
        let role: 'customer' | 'admin' = 'customer';

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData && (userData.role === 'admin' || userData.role === 'customer')) {
            role = userData.role;
          }
        } else {
          // Sử dụng cách mới để tạo document
          const currentTime = new Date();
          await userDocumentRef.set({
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
            uid: userCredential.user.uid,
            role: 'customer',
            createdAt: currentTime,
            lastLoginAt: currentTime,
          });
        }

        // Cập nhật thời gian đăng nhập cuối bằng cách mới
        await userDocumentRef.update({
          lastLoginAt: new Date(),
        });

        contextSignIn(userCredential.user.uid, role);
        showSuccess('Đăng nhập Google thành công!');
      } else {
        showError('Lỗi đăng nhập', 'Đăng nhập Google thất bại. Không tìm thấy thông tin người dùng.');
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);

      let title = 'Lỗi đăng nhập Google';
      let message = 'Đăng nhập Google thất bại.';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showError('Hủy Đăng Nhập', 'Bạn đã hủy đăng nhập Google.');
        setLoading(false);
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        message = 'Đang xử lý đăng nhập Google. Vui lòng đợi.';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        message = 'Google Play Services không khả dụng. Vui lòng cập nhật Google Play Services.';
      } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        message = 'Cần đăng nhập Google. Vui lòng thử lại.';
      } else if (error.code === '12501') {
        title = 'Lỗi cấu hình';
        message = 'Lỗi cấu hình OAuth. Kiểm tra webClientId và Android OAuth Client trong Google Console.';
      } else if (error.message?.includes('non-recoverable')) {
        title = 'Lỗi cấu hình';
        message = 'Lỗi cấu hình Google Sign-In. Vui lòng kiểm tra:\n• WebClientId trong code\n• Android OAuth Client trong Google Console\n• SHA-1 certificate';
      } else if (error.message) {
        message = `Lỗi: ${error.message}`;
      }

      showError(title, message);
    } finally {
      setLoading(false);
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn: contextSignIn } = useAuth();

  // Error modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
        showError('Thông tin thiếu', 'Vui lòng nhập đầy đủ email và mật khẩu.');
        return;
    }

    // Thêm kiểm tra định dạng email ở client
    if (!isValidEmail(trimmedEmail)) {
        showError('Email không hợp lệ', 'Địa chỉ email không đúng định dạng. Vui lòng kiểm tra lại.');
        return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().signInWithEmailAndPassword(trimmedEmail, password);
      if (userCredential.user) {
        const userDocumentRef = firestore().collection('users').doc(userCredential.user.uid);
        const userDocSnap = await userDocumentRef.get();
        let role: 'customer' | 'admin' = 'customer';

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData && (userData.role === 'admin' || userData.role === 'customer')) {
            role = userData.role;
          } else {
             console.warn(`UID ${userCredential.user.uid}: Vai trò không hợp lệ hoặc không tồn tại trong Firestore, mặc định là 'customer'.`);
          }
        } else {
          console.warn(`UID ${userCredential.user.uid}: Không tìm thấy thông tin người dùng trong Firestore, mặc định vai trò là 'customer'.`);
           // Sử dụng cách mới để tạo document
           await userDocumentRef.set({
               email: userCredential.user.email,
               uid: userCredential.user.uid,
               role: 'customer',
               createdAt: new Date(),
           });
        }
        contextSignIn(userCredential.user.uid, role);
      } else {
        showError('Lỗi đăng nhập', 'Đăng nhập thất bại. Không tìm thấy thông tin người dùng.');
      }
    } catch (error: any) {
      let title = 'Đăng nhập thất bại';
      let message = 'Có lỗi xảy ra. Vui lòng thử lại.';

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        title = 'Thông tin không đúng';
        message = 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
      }
      else if (error.code === 'auth/invalid-email') {
        title = 'Email không hợp lệ';
        message = 'Địa chỉ email không đúng định dạng.';
      } else if (error.code === 'auth/too-many-requests') {
        title = 'Quá nhiều thử';
        message = 'Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau.';
      } else if (error.code === 'auth/network-request-failed') {
        title = 'Lỗi kết nối';
        message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
      }
      showError(title, message); // Hiển thị thông báo thân thiện cho người dùng
      // console.error('Login error: ', error);    // Tạm thời bình luận dòng này nếu bạn không muốn thấy nó trên màn hình phát triển
    } finally {
        setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#fde6e9', '#e6a8b3']} style={styles.linearGradient}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.errorIconContainer}>
                <MaterialIcon name="error-outline" size={70} color="#e74c3c" />
              </View>
              <Text style={styles.modalTitle}>{errorTitle}</Text>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowErrorModal(false)}
              >
                <MaterialIcon name="close" size={18} color="#FFF" />
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.successIconContainer}>
                <MaterialIcon name="check-circle" size={70} color="#27ae60" />
              </View>
              <Text style={styles.modalTitleSuccess}>Đăng nhập thành công!</Text>
              <Text style={styles.modalMessage}>{successMessage}</Text>
              <TouchableOpacity
                style={styles.modalButtonSuccess}
                onPress={() => setShowSuccessModal(false)}
              >
                <MaterialIcon name="check" size={18} color="#FFF" />
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          {/* <View style={styles.header}>
            <Text style={styles.headerText}></Text>
          </View> */}

          <View style={styles.formContainer}>
            <Image
              source={require('../assets/logo3.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Đăng nhập</Text>

            <View style={styles.inputContainer}>
              <Icon name="envelope" size={20} color={COLORS.textMedium} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={COLORS.textMedium} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color={COLORS.textMedium} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                  <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
                  <Text style={styles.buttonText}>Đăng nhập bằng Google</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Quên mật khẩu ?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Bạn không có tài khoản ? Đăng kí ngay</Text>
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
    backgroundColor: '#F4C2C2', // Light pink color
    paddingVertical: 15,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  logo: {
    width: 250,
    height: 200,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  googleIcon: {
    marginRight: 15,
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
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#DB4437',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  loader: {
    marginVertical: 20,
  },
  link: {
    color: COLORS.primary,
    marginTop: 15,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffe6e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e6f7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitleSuccess: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalButtonSuccess: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
});

export default LoginScreen;
