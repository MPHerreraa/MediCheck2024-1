import firebase from "firebase/app";
import "firebase/auth";

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

export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();