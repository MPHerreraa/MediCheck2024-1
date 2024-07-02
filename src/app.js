// Importación de express (framework web para Node.js) y morgan (middleware para registrar peticiones HTTP)
const express = require('express'); 
const morgan = require('morgan'); 
const path = require('path'); // Importa el módulo path para manejar rutas de archivos 

// Importación de la constante db del archivo firebase.js 
const {db} = require('./firebase') 

// Declaración de la constante app, la cual permite utilizar express 
const app = express(); 

app.use(express.json()); 
app.use(morgan('dev')); 

// En cuanto carga la página, se realiza una petición GET 
app.get('/eventos', async (req, res) => {
    // Se guardan los valores de la colección Eventos en la constante querySnapshot (lo primero que se verá en la página)
    const querySnapshot = await db.collection('Eventos').get()

    // Se imprimen por consola el nombre y el valor de los elementos de querySnapshot 
    res.send((querySnapshot.docs[0].data())); 
})

// Datos predeterminados para insertar en la colección 'Eventos'
const predefinedData = {
    ActividadFisica: true,
    AlimentacionSaludable: true,
    ConsumoDeAlcohol: false,
    ConsumoDeTabaco: false,
    FechaVacuna: new Date().toISOString(), // Fecha actual en formato ISO
    Medicacion: true,
    MinSueño: true,
    NombreMdicamento: "Ibuprofeno",
    NombreVacuna: "COVID-19",
    TimestampMedicacion: new Date().toISOString(),
    Vacunacion: true,
};

// Endpoint POST para insertar datos predeterminados en la colección 'Eventos'
app.post('/eventos', async (req, res) => {
    // Añade los datos predeterminados a la colección 'Eventos'
    const docRef = await db.collection('Eventos').add(predefinedData);
    // Envía el ID del documento creado y los datos como respuesta
    res.send({ id: docRef.id, ...predefinedData });
});

// Endpoint GET para servir el archivo HTML
app.get('/', (req, res) => {
    // Envía el archivo index.html como respuesta
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Exporta la constante app para que ezpress pueda ser utilizado en otros archivos
module.exports = app; 