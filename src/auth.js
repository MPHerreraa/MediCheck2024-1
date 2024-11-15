import { auth, provider } from './firebase-config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { USER_ROLES } from './UserRoles';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('userRole').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreUsuario: username,
                correoElectronico: email,
                contraseña: password,
                rol: role
            })
        });

        alert('Registro exitoso');
    } catch (error) {
        alert('Error en el registro: ' + error.message);
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        const response = await fetch('/user-role', {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        const userData = await response.json();
        
        if (userData.role === USER_ROLES.DOCTOR) {
            document.getElementById('patientListContainer').style.display = 'block';
        }
        
        document.getElementById('calendarContainer').style.display = 'block';
        alert('Inicio de sesión exitoso');
    } catch (error) {
        alert('Error en el inicio de sesión: ' + error.message);
    }
});

document.getElementById('googleLogin').addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const token = await user.getIdToken();

        await fetch('/login-google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId: token })
        });

        alert('Inicio de sesión con Google exitoso');
        document.getElementById('calendarContainer').style.display = 'block';
    } catch (error) {
        alert('Error en el inicio de sesión con Google: ' + error.message);
    }
})