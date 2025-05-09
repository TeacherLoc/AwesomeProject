// filepath: screens/Auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Import FirebaseAuthTypes
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Import FirebaseFirestoreTypes
import { COLORS } from '../theme/colors'; // Import COLORS

// Hàm kiểm tra định dạng email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm kiểm tra tên không chứa số
const isValidName = (name: string): boolean => {
  const nameRegex = /^[^\d]+$/; // Chỉ cho phép các ký tự không phải là số
  return nameRegex.test(name);
};

// Hàm kiểm tra mật khẩu chứa ít nhất một chữ số
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

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    // Bỏ comment phone.trim() nếu bạn muốn trường phone là bắt buộc
    if (!trimmedName || !trimmedEmail || !password /* || !phone.trim() */) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc: Họ tên, Email, Mật khẩu.');
        return;
    }

    // Kiểm tra Full Name không chứa số
    if (!isValidName(trimmedName)) {
        Alert.alert('Lỗi', 'Họ tên không được chứa chữ số.');
        return;
    }

    // Kiểm tra định dạng Email
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

    // Kiểm tra mật khẩu phải chứa ít nhất một chữ số
    if (!hasNumber(password)) {
        Alert.alert('Lỗi', 'Mật khẩu phải chứa ít nhất một chữ số.');
        return;
    }

    setLoading(true);
    try {
      console.log('Attempting to create user in Firebase Auth...');
      const userCredential: FirebaseAuthTypes.UserCredential = await auth().createUserWithEmailAndPassword(trimmedEmail, password);
      const user = userCredential.user;
      console.log('User created in Firebase Auth, UID:', user.uid);

      if (user) {
        await user.updateProfile({
          displayName: trimmedName,
        });
        console.log('User profile updated in Firebase Auth (displayName).');

        const userData: {
            uid: string;
            name: string;
            email: string | null;
            phone: string;
            role: string;
            createdAt: FirebaseFirestoreTypes.FieldValue;
        } = {
          uid: user.uid,
          name: trimmedName,
          email: user.email,
          phone: phone.trim(), // Save phone
          role: 'customer', // Default role is customer
          createdAt: firestore.FieldValue.serverTimestamp(),
        };

        console.log('Attempting to set user data in Firestore:', userData);
        await firestore().collection('users').doc(user.uid).set(userData);
        console.log('User data successfully set in Firestore.');

        Alert.alert('Thành công', 'Đăng kí tài khoản thành công!.');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      // console.error('Registration Error:', error); // Tạm thời bình luận nếu không muốn thấy
      // console.error('Error Code:', error.code);   // Tạm thời bình luận nếu không muốn thấy
      // console.error('Error Message:', error.message); // Tạm thời bình luận nếu không muốn thấy
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Lỗi', 'Email đã có người sử dụng!');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Lỗi', 'Email không phù hợp!');
      } else {
        Alert.alert('Lỗi', `Đăng kí thất bại: ${error.message}`);
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <TextInput
        style={styles.input}
        placeholder="Họ và Tên"
        placeholderTextColor={COLORS.textLight}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textLight}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại (Không bắt buộc)"
        placeholderTextColor={COLORS.textLight}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        placeholderTextColor={COLORS.textLight}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        placeholderTextColor={COLORS.textLight}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
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
        marginBottom: 30, // Increased margin
        color: COLORS.textDark, // Changed title color
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border, // Changed border color
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
        paddingVertical: 12, // Adjusted padding
        width: '100%',
        height: 50, // Standardized height
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
        marginTop: 20, // Increased margin
    },
    buttonText: {
        color: COLORS.white, // Changed button text color
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginLinkContainer: { // Added for better touch area and spacing
        marginTop: 20,
        padding: 10,
    },
    link: {
        color: COLORS.primary, // Changed link color
        fontSize: 14,
        textAlign: 'center',
    },
    loader: {
        marginTop: 20, // Adjusted margin
    }});

export default RegisterScreen;
