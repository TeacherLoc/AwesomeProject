// // filepath: c:\Users\Loocj\Desktop\AwesomeProject\App.tsx
// import React from 'react';
// import { SafeAreaView, StyleSheet } from 'react-native'; // Thêm View
// import AppNavigator from './navigation/AppNavigator';
// import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import
// // import Calculate from './lab1/Calculate';

// const App = () => {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaView style={styles.container}>
//         <AppNavigator />
//       </SafeAreaView>
//     </GestureHandlerRootView>
    
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
// });

// export default App;

// Nếu là App.tsx (TypeScript)
import React from 'react';
import AppNavigator from './lab2/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;

// Nếu là App.js (JavaScript)
// import React from 'react';
// import AppNavigator from './src/navigation/AppNavigator';
// import { SafeAreaProvider } from 'react-native-safe-area-context';

// const App = () => {
//   return (
//     <SafeAreaProvider>
//       <AppNavigator />
//     </SafeAreaProvider>
//   );
// };

// export default App;