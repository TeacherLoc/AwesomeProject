import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './lab2/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { AuthProvider } from './lab2/navigation/AuthContext';
// Suppress Firebase deprecation warnings
import './lab2/utils/WarningsSuppressor';
import './lab2/config/FirebaseWarningsSuppressor';

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
