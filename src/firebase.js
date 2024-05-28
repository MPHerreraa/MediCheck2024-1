// Importación del módulo dotenv para cargar variables del archivo .env
require('dotenv').config(); 

// Importación de las funciones necesarias de firebase-admin para inicializar la aplicación firebase
const {initializeApp, applicationDefault} = require('firebase-admin/app'); 

// Importación de la función para instanciar Firestore
const {getFirestore} = require('firebase-admin/firestore'); 

// Inicialización de Firebase con sus credenciales
initializeApp({
    credential: applicationDefault(), 
})

// Declaración de la constante db (database) 
const db = getFirestore() 

// Exportación de la constante db para que pueda ser utilizada en otros archivos 
module.exports = {
    db, 
}