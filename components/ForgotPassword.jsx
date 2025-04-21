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


const ForgotPassword = ({ setIsForgotPassword }) => {
 const [email, setEmail] = useState('');


 const handleResetPassword = () => {
 
 Alert.alert('Reset Password', `A password reset link has been sent to ${email}`);
 setIsForgotPassword(false); 
 };


 return (
 <View style={styles.container}>
 <Text style={styles.title}>Forgot Password</Text>
 <Text style={styles.subtitle}>
 Enter your email address and we'll send you a link to reset your password.
 </Text>
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
 <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
 <Text style={styles.buttonText}>Send Reset Link</Text>
 </TouchableOpacity>
 <TouchableOpacity onPress={() => setIsForgotPassword(false)}>
 <Text style={styles.link}>Back to Login</Text>
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
 subtitle: {
 fontSize: 16,
 textAlign: 'center',
 marginBottom: 20,
 color: '#555',
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
});

export default ForgotPassword;