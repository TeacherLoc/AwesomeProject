import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import React from 'react';

const Project2 = () => {
  const handlePress = () => {
    Alert.alert('Chao ban', 'Ban da nhan vao button!');
  };

  return (
    <View style={styles.container}>
      <Button title="BUTTON 1" onPress={handlePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    width: '80%',
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default Project2;