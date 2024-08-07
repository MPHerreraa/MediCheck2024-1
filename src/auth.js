// src/auth.js
import { auth, googleProvider } from "./firebase-config";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore(); // Inicializa Firestore

const authContainer = document.getElementById('authContainer');
const calendarContainer = document.getElementById('calendarContainer');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const googleLoginButton = document.getElementById('googleLogin');

// Registro de usuario
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            await user.updateProfile({
                displayName: username
            });

            // Guarda la información adicional en Firestore
            await setDoc(doc(db, "users", user.uid), {
                NombreUsuario: username,
                CorreoElectronico: email,
                Contraseña: password
            });

            console.log('Registro exitoso', user);
            checkAuthState();
        })
        .catch((error) => {
            console.error('Error en el registro', error);
        });
});

// Inicio de sesión de usuario
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Busca el usuario en Firestore por nombre de usuario
    const usersRef = db.collection('users');
    usersRef.where('NombreUsuario', '==', username).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                console.error('Nombre de usuario no encontrado');
                return;
            }
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Inicia sesión con el correo electrónico asociado
            auth.signInWithEmailAndPassword(userData.CorreoElectronico, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log('Inicio de sesión exitoso', user);
                    checkAuthState();
                })
                .catch((error) => {
                    console.error('Error en el inicio de sesión', error);
                });
        })
        .catch((error) => {
            console.error('Error al buscar el usuario', error);
        });
});

// Inicio de sesión con Google
googleLoginButton.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider)
        .then(async (result) => {
            const user = result.user;
            console.log('Inicio de sesión con Google exitoso', user);

            // Guarda la información adicional en Firestore si es un nuevo usuario
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await setDoc(doc(db, "users", user.uid), {
                    NombreUsuario: user.displayName,
                    CorreoElectronico: user.email
                });
            }

            checkAuthState();
        })
        .catch((error) => {
            console.error('Error en el inicio de sesión con Google', error);
        });
});

// Verifica el estado de autenticación del usuario
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Usuario autenticado', user);
            authContainer.style.display = 'none';
            calendarContainer.style.display = 'block';
        } else {
            console.log('Usuario no autenticado');
            authContainer.style.display = 'block';
            calendarContainer.style.display = 'none';
        }
    });
}

checkAuthState();