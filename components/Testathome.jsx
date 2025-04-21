import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { TextInput } from 'react-native-paper'

const testathome = () => {
  return (
    <View>
    <TextInput style = {styles.input}
    placewolder="USERNAME"
    placeholderTextColor="#000"
    />
    <Text>Loc la nhat</Text>
    </View>
  )
}

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

export default testathome