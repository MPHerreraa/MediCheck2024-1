import firebase from "firebase/app";
import "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBcQ72kxcNL3Ts70W9fzvCHWCZ6QRvHdXQ",
  authDomain: "medicheckf-3fdec.firebaseapp.com",
  projectId: "medicheckf-3fdec",
  storageBucket: "medicheckf-3fdec.firebasestorage.app",
  messagingSenderId: "250853813007",
  appId: "1:250853813007:web:d75953a90a808dd4486c7a",
  measurementId: "G-L9PTKEN06Y"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider, Timestamp };