import React, { useState } from 'react';
// Thêm các import cần thiết từ react-native
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image, // Thêm Image
} from 'react-native';
// Thêm import Icon
import Icon from 'react-native-vector-icons/FontAwesome';
// Thêm import useNavigation
import { useNavigation } from '@react-navigation/native';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Gọi hook useNavigation để lấy đối tượng navigation
  const navigation = useNavigation();

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = () => {
    const defaultEmail = 'loc123@gmail.com';
    const defaultPassword = 'loc1234';

    if (email === defaultEmail && password === defaultPassword) {
      Alert.alert('Success', 'Login successful!');
      // Ví dụ: Điều hướng đến màn hình Home sau khi đăng nhập thành công
      // navigation.navigate('Home');
    } else {
      Alert.alert('Error', 'Invalid email or password.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/lo.png')} // Đảm bảo đường dẫn đúng
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome back!</Text>
      <View style={styles.inputContainer}>
        <Icon name="envelope" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
          <Icon
            name={showPassword ? 'eye' : 'eye-slash'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      {/* Sử dụng navigation.navigate */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create a new account?</Text>
      </TouchableOpacity>
      {/* Sử dụng navigation.navigate */}
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot Password</Text>
      </TouchableOpacity>
    </View>
  );
};

// Giữ nguyên styles...
const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#fff',
   alignItems: 'center',
   justifyContent: 'center',
   padding: 20,
 },
 logo: {
   width: 100,
   height: 100,
   marginBottom: 20,
 },
 title: {
   fontSize: 24,
   fontWeight: 'bold',
   marginBottom: 20,
 },
 inputContainer: {
   width: '100%',
   flexDirection: 'row',
   alignItems: 'center',
   borderColor: 'gray',
   borderWidth: 1,
   borderRadius: 5,
   paddingHorizontal: 10,
   marginBottom: 10,
 },
 input: {
   flex: 1,
   height: 40,
   paddingHorizontal: 10,
 },
 icon: {
   marginRight: 10,
 },
 button: {
   backgroundColor: 'orange',
   padding: 10,
   borderRadius: 5,
   width: '100%',
   alignItems: 'center',
   marginBottom: 10,
 },
 buttonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
 link: {
   color: 'blue',
   fontSize: 14,
   marginBottom: 5,
 },
 eyeIcon: {
   padding: 5,
 },
});


export default Login; 