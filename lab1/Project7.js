import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

const Project7 = () => {
  const [name, setName] = useState('');

  // Hàm xử lý khi nhấn nút "Say Hello"
  const handleSayHello = () => {
    if (name.trim()) {
      // Kiểm tra xem tên có được nhập không
      Alert.alert(`Hello, ${name}!`);
    } else {
      Alert.alert('Please enter your name.');
    }
    Keyboard.dismiss(); // Ẩn bàn phím sau khi nhấn nút
  };

  // Hàm để ẩn bàn phím khi nhấn ra ngoài TextInput
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    // Sử dụng TouchableWithoutFeedback để bắt sự kiện nhấn ra ngoài
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>What is your name?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleSayHello} 
            returnKeyType="go"
          />
          <Button title="Say Hello" onPress={handleSayHello} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    width: '100%',
  },
});

export default Project7;