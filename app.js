const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { db, admin } = require('./src/firebase');

const app = express();

app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'src')));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

// Ruta para eventos
app.get('/eventos', async (req, res) => {
    try {
        const querySnapshot = await db.collection('Eventos').get();
        res.send(querySnapshot.docs.map(doc => doc.data()));
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener eventos' });
    }
});

// Endpoint para cargar una vacuna en un día específico
app.post('/vacuna', async (req, res) => {
    const { diaDeEvento, nombreVacuna, notasVacunacion } = req.body;

    if (!diaDeEvento || !nombreVacuna) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
        const vacunaData = {
            NombreVacuna: nombreVacuna,
            NotasVacunacion: notasVacunacion || '',
            TimestampVacunacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
            Vacunacion: true,
        };

        await db.collection('Eventos').doc(diaDeEvento).set({
            Vacunas: admin.firestore.FieldValue.arrayUnion(vacunaData),
            TimestampVacunacion: vacunaData.TimestampVacunacion,
            Vacunacion: true,
        }, { merge: true });

        res.send({ success: true, vacunaData });
    } catch (error) {
        res.status(500).send({ error: 'Error al agregar vacuna' });
    }
});

// Endpoint para cargar medicación en un día específico
app.post('/medicacion', async (req, res) => {
    const { diaDeEvento, nombreMedicamento, cantidadMedicamento, notasMedicamento } = req.body;

    if (!diaDeEvento || !nombreMedicamento || !cantidadMedicamento) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
        const medicacionData = {
            NombreMedicamento: nombreMedicamento,
            CantidadMedicamento: cantidadMedicamento,
            NotasMedicamento: notasMedicamento || '',
            TimestampMedicacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
            Medicacion: true,
        };

        await db.collection('Eventos').doc(diaDeEvento).set({
            Medicaciones: admin.firestore.FieldValue.arrayUnion(medicacionData),
            TimestampMedicacion: medicacionData.TimestampMedicacion,
            Medicacion: true,
        }, { merge: true });

        res.send({ success: true, medicacionData });
    } catch (error) {
        res.status(500).send({ error: 'Error al agregar medicación' });
    }
});

// Endpoint para cargar hábitos en un día específico
app.post('/habitos', async (req, res) => {
    const { diaDeEvento, actividadFisica, alimentacionSaludable, consumoDeAlcohol, consumoDeTabaco, minSueño } = req.body;

    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }

    try {
        const habitosSaludables = {
            ActividadFisica: actividadFisica || false,
            AlimentacionSaludable: alimentacionSaludable || false,
            MinSueño: minSueño || false,
            TimestampHabitosSaludables: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        };

        const habitosNoSaludables = {
            ConsumoDeAlcohol: consumoDeAlcohol || false,
            ConsumoDeTabaco: consumoDeTabaco || false,
            TimestampHabitosNoSaludables: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        };

        await db.collection('Eventos').doc(diaDeEvento).set({
            ...habitosSaludables,
            ...habitosNoSaludables
        }, { merge: true });

        res.send({ success: true, habitosSaludables, habitosNoSaludables });
    } catch (error) {
        res.status(500).send({ error: 'Error al agregar hábitos' });
    }
});

// Ruta para el registro de usuario
app.post('/register', async (req, res) => {
    const { nombreUsuario, correoElectronico, contraseña } = req.body;

    try {
        // Guarda los datos del usuario en la colección "usuarios"
        await db.collection('usuarios').add({
            NombreUsuario: nombreUsuario,
            CorreoElectronico: correoElectronico,
            Contraseña: contraseña
        });
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// Ruta para el inicio de sesión con Google
app.post('/login-google', async (req, res) => {
    const { tokenId } = req.body;

    try {
        // Verifica el token con Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(tokenId);
        const uid = decodedToken.uid;

        // Comprueba si el usuario ya existe en Firestore
        const userDoc = await db.collection('usuarios').doc(uid).get();

        if (!userDoc.exists) {
            // Si no existe, crea un nuevo registro
            await db.collection('usuarios').doc(uid).set({
                NombreUsuario: decodedToken.name,
                CorreoElectronico: decodedToken.email
            });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = app;