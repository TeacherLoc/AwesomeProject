import { LogBox } from 'react-native';

// Tắt tất cả các Firebase deprecation warnings trong development
LogBox.ignoreLogs([
  // Firebase deprecation warnings
  'This method is deprecated',
  'signInWithEmailAndPassword',
  'collection()',
  'doc()',
  'FieldValue',
  'getApp()',
  'signInWithCredential',
  'serverTimestamp',
  // Google Sign-In warnings
  'GoogleAuthProvider',
  // Migration warnings
  'migrating-to-v22',
  // Other common warnings
  'Require cycle:',
  'Warning: Failed prop type:',
  'Animated: `useNativeDriver`',
]);

export default LogBox;
