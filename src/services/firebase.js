// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgUJ1_72-_8B5ImVpx3Xl19E8zzg8SuoQ",
  authDomain: "vrk-waffles-and-more.firebaseapp.com",
  projectId: "vrk-waffles-and-more",
  storageBucket: "vrk-waffles-and-more.firebasestorage.app",
  messagingSenderId: "1012150955992",
  appId: "1:1012150955992:web:f0481d8326236580798cad",
  measurementId: "G-7SPY6DVTR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);

export { db };