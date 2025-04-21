import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const BTH1 = () => {
  

  return (
    <View style={styles.container}>
        <View style={styles.box}>
            <Text>Hello World</Text>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  box: {
    height: 50,
    width: 300,
    backgroundColor: 'aqua',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BTH1;