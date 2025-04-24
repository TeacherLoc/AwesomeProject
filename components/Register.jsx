import React, { useState } from 'react';
import {
 View,
 Text,
 TextInput,
 TouchableOpacity,
 StyleSheet,
 Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Register = ({ setIsRegistering }) => {
 const [newEmail, setNewEmail] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 const toggleShowPassword = () => {
 setShowPassword(!showPassword);
 };

 const handleRegister = () => {
 if (newPassword !== confirmPassword) {
 Alert.alert('Error', 'Passwords do not match.');
 return;
 }
 Alert.alert('Success', `Registered with email: ${newEmail} and password: ${newPassword}`);
 setIsRegistering(false);
 };

 return (
 <View style={styles.container}>
 <Text style={styles.title}>Create a new account</Text>
 <View style={styles.inputContainer}>
 <Icon name="envelope" size={20} color="#888" style={styles.icon} />
 <TextInput
 style={styles.input}
 placeholder="Enter email"
 value={newEmail}
 onChangeText={setNewEmail}
 keyboardType="email-address"
 />
 </View>
 <View style={styles.inputContainer}>
 <Icon name="lock" size={20} color="#888" style={styles.icon} />
 <TextInput
 style={styles.input}
 placeholder="Enter password"
 value={newPassword}
 onChangeText={setNewPassword}
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
 <View style={styles.inputContainer}>
 <Icon name="lock" size={20} color="#888" style={styles.icon} />
 <TextInput
 style={styles.input}
 placeholder="Confirm password"
 value={confirmPassword}
 onChangeText={setConfirmPassword}
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
 <TouchableOpacity style={styles.button} onPress={handleRegister}>
 <Text style={styles.buttonText}>Register</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => setIsRegistering(false)}>
 <Text style={styles.link}>Already have an account? Login</Text>
 </TouchableOpacity>
 </View>
 );
};

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#fff',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 20,
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

export default Register;