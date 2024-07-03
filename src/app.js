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
    ActividadFisica: false,
    AlimentacionSaludable: false,
    ConsumoDeAlcohol: false,
    ConsumoDeTabaco: false,
    FechaVacuna: new Date().toISOString(),
    Medicacion: false,
    MinSueño: false,
    NombreMdicamento: "",
    NombreVacuna: "",
    TimestampMedicacion: new Date().toISOString(),
    Vacunacion: false,
};

// Endpoint POST para insertar datos predeterminados en la colección 'Eventos'
app.post('/eventos', async (req, res) => {
    const { fechaVacuna, horaVacuna, fechaMedicacion, horaMedicacion } = req.body;

    // Validar que las fechas y horas estén en el formato correcto
    if (!fechaVacuna || !horaVacuna || !fechaMedicacion || !horaMedicacion) {
        return res.status(400).send({ error: 'Fecha y hora son requeridas para la vacunación y la medicación' });
    }

    // Combinar fecha y hora en un solo objeto Date para la vacuna
    const combinedDateTimeVacuna = new Date(`${fechaVacuna}T${horaVacuna}`);
    const timestampVacuna = admin.firestore.Timestamp.fromDate(combinedDateTimeVacuna);

    // Combinar fecha y hora en un solo objeto Date para la medicación
    const combinedDateTimeMedicacion = new Date(`${fechaMedicacion}T${horaMedicacion}`);
    const timestampMedicacion = admin.firestore.Timestamp.fromDate(combinedDateTimeMedicacion);

    // Actualizar predefinedData con los valores proporcionados
    const dataToInsert = {
        ...predefinedData,
        FechaVacuna: timestampVacuna,
        TimestampMedicacion: timestampMedicacion,
    };

    // Añadir los datos a la colección 'Eventos'
    const docRef = await db.collection('Eventos').add(dataToInsert);
    res.send({ id: docRef.id, ...dataToInsert });
});

app.get('/', (req, res) => {
    // Envía el archivo index.html como respuesta
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Exporta la constante app para que ezpress pueda ser utilizado en otros archivos
module.exports = app;