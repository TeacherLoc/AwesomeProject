import React from 'react';
import {StyleSheet, View, Text, ScrollView} from 'react-native';

const Project6 = () => {
  // Tạo một mảng dữ liệu để render các ô vuông
  const squares = Array.from({length: 15}, (_, i) => `Square ${i + 1}`);

  return (
    // Sử dụng ScrollView để cho phép cuộn nội dung
    <ScrollView style={styles.scrollViewContainer}>
      <View style={styles.contentContainer}>
        {squares.map((text, index) => (
          // Render từng ô vuông
          <View key={index} style={styles.box}>
            <Text style={styles.text}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  box: {
    width: 150,
    height: 80,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderRadius: 5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Project6;