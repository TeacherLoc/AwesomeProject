import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './lab2/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { AuthProvider } from './lab2/navigation/AuthContext';

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={'dark-content'} />
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default App;
