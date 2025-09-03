// Firebase Configuration to suppress warnings
import { LogBox } from 'react-native';

// Suppress all Firebase-related warnings
LogBox.ignoreLogs([
  // Firestore warnings
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
  'Please see migration guide for more details: https://rnfirebase.io/migrating-to-v22',
  'Method called was `signInWithEmailAndPassword`',
  'Method called was `collection`',
  'Method called was `doc`',
  'Method called was `FieldValue`',
  'Method called was `serverTimestamp`',
  'Method called was `signInWithCredential`',
  'Method called was `getApp`',
  
  // Auth warnings
  'GoogleAuthProvider',
  'signInWithCredential',
  'signInWithEmailAndPassword',
  
  // General Firebase warnings
  'Warning: Possible Unhandled Promise Rejection',
  'Setting a timer for a long period of time',
  
  // Development warnings
  'Remote debugger',
  'Require cycle:',
]);

console.log('🔇 Firebase warnings suppressed for development');

export default null;
