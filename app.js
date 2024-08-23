const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const { db, admin } = require('./src/firebase');

const app = express();

app.use(cors({
    origin: [/^http:\/\/localhost:\d+$/] // Regular expression to match any localhost port
  }));

app.use(express.json());
app.use(morgan('dev'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'src')));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

// Ruta para el registro de usuario
app.post('/register', async (req, res) => {
    const { nombreUsuario, correoElectronico, contraseña } = req.body;

    if (!nombreUsuario || !correoElectronico || !contraseña) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Verificar si el usuario ya existe
        const userQuery = await db.collection('Usuarios')
            .where('CorreoElectronico', '==', correoElectronico)
            .get();

        if (!userQuery.empty) {
            return res.status(400).send({ error: 'El correo electrónico ya está registrado' });
        }

        // Agregar el nuevo usuario a Firestore
        await db.collection('Usuarios').add({
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
        const decodedToken = await admin.auth().verifyIdToken(tokenId);
        const uid = decodedToken.uid;

        // Verificar si el usuario ya existe
        const userRef = db.collection('Usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Si no existe, agregar el nuevo usuario a Firestore
            await userRef.set({
                NombreUsuario: decodedToken.name,
                CorreoElectronico: decodedToken.email
            });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// Ruta para obtener los eventos
app.get('/eventos', async (req, res) => {
    try {
        const querySnapshot = await db.collection('Eventos').get();
        res.send(querySnapshot.docs.map(doc => doc.data()));
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener los eventos' });
    }
});

// Ruta para cargar una vacuna en un día específico
app.post('/vacuna', async (req, res) => {
    const { diaDeEvento, nombreVacuna, notasVacunacion } = req.body;

    if (!diaDeEvento || !nombreVacuna) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    const vacunaData = {
        NombreVacuna: nombreVacuna,
        NotasVacunacion: notasVacunacion || '',
        TimestampVacunacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        Vacunacion: true,
    };

    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            Vacunas: admin.firestore.FieldValue.arrayUnion(vacunaData),
            TimestampVacunacion: vacunaData.TimestampVacunacion,
            Vacunacion: true,
        }, { merge: true });

        res.send({ success: true, vacunaData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la vacuna' });
    }
});

// Ruta para cargar medicación en un día específico
app.post('/medicacion', async (req, res) => {
    const { diaDeEvento, nombreMedicamento, cantidadMedicamento, notasMedicamento } = req.body;

    if (!diaDeEvento || !nombreMedicamento || !cantidadMedicamento) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    const medicacionData = {
        NombreMedicamento: nombreMedicamento,
        CantidadMedicamento: cantidadMedicamento,
        NotasMedicamento: notasMedicamento || '',
        TimestampMedicacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        Medicacion: true,
    };

    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            Medicaciones: admin.firestore.FieldValue.arrayUnion(medicacionData),
            TimestampMedicacion: medicacionData.TimestampMedicacion,
            Medicacion: true,
        }, { merge: true });

        res.send({ success: true, medicacionData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la medicación' });
    }
});

// Ruta para cargar hábitos en un día específico
app.post('/habitos', async (req, res) => {
    const { diaDeEvento, actividadFisica, alimentacionSaludable, consumoDeAlcohol, consumoDeTabaco, minSueño } = req.body;

    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }

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

    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            ...habitosSaludables,
            ...habitosNoSaludables
        }, { merge: true });

        res.send({ success: true, habitosSaludables, habitosNoSaludables });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar los hábitos' });
    }
});

module.exports = app;