import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
// Firebase Auth (v9 modular API)
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
// Firebase Firestore (v9 modular API)
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors';
import { useAuth } from '../navigation/AuthContext';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn: contextSignIn } = useAuth();

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
        Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu.');
        return;
    }

    // Thêm kiểm tra định dạng email ở client
    if (!isValidEmail(trimmedEmail)) {
        Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.');
        return;
    }

    setLoading(true);
    const authInstance = getAuth();
    const firestoreInstance = getFirestore();

    try {
      const userCredential = await signInWithEmailAndPassword(authInstance, trimmedEmail, password);
      if (userCredential.user) {
        const userDocumentRef = doc(firestoreInstance, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocumentRef);
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
           await setDoc(userDocumentRef, {
               email: userCredential.user.email,
               uid: userCredential.user.uid,
               role: 'customer',
               createdAt: serverTimestamp(),
           }, { merge: true });
        }
        contextSignIn(userCredential.user.uid, role);
      } else {
        Alert.alert('Lỗi', 'Đăng nhập thất bại. Không tìm thấy thông tin người dùng.');
      }
    } catch (error: any) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Sai email hoặc mật khẩu.';
      }
      else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Địa chỉ email không hợp lệ.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.';
      }
      Alert.alert('Lỗi đăng nhập', errorMessage); // Hiển thị thông báo thân thiện cho người dùng
      // console.error('Login error: ', error);    // Tạm thời bình luận dòng này nếu bạn không muốn thấy nó trên màn hình phát triển
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../assets/logolab3.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Loocj Xin Chào</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Quên mật khẩu ?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Bạn không có tài khoản ? Đăng kí ngay</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 180,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: COLORS.white,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.textDark,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
      marginTop: 20,
  },
  link: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
