/import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Función para el registro de usuario
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        // Crear usuario con email y contraseña
        await createUserWithEmailAndPassword(auth, email, password);

        // Enviar datos del usuario al servidor
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreUsuario: username,
                correoElectronico: email,
                contraseña: password
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Registro exitoso');
            // Redirigir o mostrar el calendario
        } else {
            alert('Error al registrar: ' + result.message);
        }
    } catch (error) {
        console.error('Error en el registro:', error);
    }
});

// Función para el inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        // Iniciar sesión con email y contraseña
        await signInWithEmailAndPassword(auth, email, password);

        // Redirigir o mostrar el calendario
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('calendarContainer').style.display = 'block';
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
    }
});

// Función para el inicio de sesión con Google
document.getElementById('googleLogin').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken();

        // Enviar token al servidor para verificación
        const response = await fetch('/login-google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tokenId: token
            })
        });

        const resultServer = await response.json();

        if (resultServer.success) {
            // Redirigir o mostrar el calendario
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('calendarContainer').style.display = 'block';
        } else {
            alert('Error al iniciar sesión con Google: ' + resultServer.message);
        }
    } catch (error) {
        console.error('Error en el inicio de sesión con Google:', error);
    }
});