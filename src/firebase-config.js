import firebase from "firebase/app";
import "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyCyfTSKJ1ZsTbdvWkIPekJrdp8VjG7YlCg",
    authDomain: "medicheck-4ab95.firebaseapp.com",
    projectId: "medicheck-4ab95",
    storageBucket: "medicheck-4ab95.appspot.com",
    messagingSenderId: "388747719771",
    appId: "1:388747719771:web:755798c184858c80d3fb7e",
    measurementId: "G-Q3SFNRTTYT"
  };

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider, Timestamp };