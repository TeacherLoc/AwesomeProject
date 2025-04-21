import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Project4 = () => {
  const [count, setCount] = useState(0); // State to track the number of button presses

  const handlePress = () => {
    setCount(count + 1); // Increment the count on button press
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Button Press Counter</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Press Me</Text>
      </TouchableOpacity>
      <Text style={styles.counterText}>You have pressed the button {count} times.</Text>
    </View>
  );
};

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
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterText: {
    fontSize: 18,
    color: '#333',
  },
});

export default Project4;