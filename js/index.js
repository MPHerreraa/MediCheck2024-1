// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyfTSKJ1ZsTbdvWkIPekJrdp8VjG7YlCg",
  authDomain: "medicheck-4ab95.firebaseapp.com",
  projectId: "medicheck-4ab95",
  storageBucket: "medicheck-4ab95.appspot.com",
  messagingSenderId: "388747719771",
  appId: "1:388747719771:web:755798c184858c80d3fb7e",
  measurementId: "G-Q3SFNRTTYT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);