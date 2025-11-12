import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDQrU0s0TarzYeQ0mkY42tk-6HTdqsO3zg",
  authDomain: "awesome-3bfad.firebaseapp.com",
  databaseURL: "https://awesome-3bfad-default-rtdb.firebaseio.com",
  projectId: "awesome-3bfad",
  storageBucket: "awesome-3bfad.firebasestorage.app",
  messagingSenderId: "86886142020",
  appId: "1:86886142020:web:8de46db3fda69686032c11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
