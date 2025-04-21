import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import React from 'react';

const CustomButton = ({ text, onPress, color }) => {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
};

export default function Project3() {
  const handleHello = () => {
    Alert.alert('Xin chao', 'Welcome');
  };

  const handleGoodbye = () => {
    Alert.alert('Tam biet', 'Goodbye');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project3</Text>
      <CustomButton text="Hello" onPress={handleHello} color="red" />
      <CustomButton text="Goodbye" onPress={handleGoodbye} color="green" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});