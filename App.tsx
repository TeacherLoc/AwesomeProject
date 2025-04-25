// filepath: c:\Users\Loocj\Desktop\AwesomeProject\App.tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native'; // Thêm View
// import AppNavigator from './navigation/AppNavigator';
// import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import
import Calculate from './lab1/Calculate';

const App = () => {
  return (
    // Bọc toàn bộ ứng dụng bằng GestureHandlerRootView
    // <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
    {/* //     <AppNavigator /> */}
            <Calculate />
      </SafeAreaView>
    // </GestureHandlerRootView>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;