// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2QOqscrdG0s4CkotUv5r0DoioKNyebd8",
  authDomain: "inventorypos-d2b82.firebaseapp.com",
  projectId: "inventorypos-d2b82",
  storageBucket: "inventorypos-d2b82.firebasestorage.app",
  messagingSenderId: "749824455484",
  appId: "1:749824455484:web:6ff29e24852c2ee12be439"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;