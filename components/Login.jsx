import React, { useState } from 'react';
import {
 View,
 Text,
 TextInput,
 TouchableOpacity,
 StyleSheet,
 Image,
 Alert, // Import Alert
} from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import Register from './Register'; 
import ForgotPassword from './ForgotPassword'; 


export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false); 
 const [isRegistering, setIsRegistering] = useState(false); 
 const [isForgotPassword, setIsForgotPassword] = useState(false); 


 const toggleShowPassword = () => {
 setShowPassword(!showPassword);
 };


 const handleLogin = () => {
    // set default cho tài khoản và mật khẩu 
    const defaultEmail = 'loc123@gmail.com';
    const defaultPassword = 'loc1234';


    if (email === defaultEmail && password === defaultPassword) {
    
    Alert.alert('Success', 'Login successful!');
    } else {
    // Login failed
    Alert.alert('Error', 'Invalid email or password.');
    }
 };


    if (isRegistering) {
    return <Register setIsRegistering={setIsRegistering} />;
    }


    if (isForgotPassword) {
    return <ForgotPassword setIsForgotPassword={setIsForgotPassword} />;
    }


 return (
 <View style={styles.container}>
 <Image
 source={require('../assets/lo.png')}
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
    <Text style={styles.error}>Email is a required field</Text>
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
            <Text style={styles.error}>Password is a required field</Text>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsRegistering(true)}>
                <Text style={styles.link}>Create a new account?</Text>
            </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsForgotPassword(true)}>
                <Text style={styles.link}>Forgot Password</Text>
            </TouchableOpacity>
                <Text style={styles.footer}>LOC VO APP </Text>
        </View>
    );
}


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
 error: {
 color: 'red',
 fontSize: 12,
 marginBottom: 10,
 alignSelf: 'flex-start',
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
 footer: {
 color: 'gray',
 fontSize: 12,
 marginTop: 20,
 },
 eyeIcon: {
 padding: 5,
 },
});
