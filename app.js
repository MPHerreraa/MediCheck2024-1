const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const { db } = require('./src/firebase');
const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const app = express();
const corsOptions = {
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization'
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(morgan('dev'));


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'src')));


// Endpoint para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'login.html'));
});


// Endpoint para el registro de usuario
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


// Endpoint para el inicio de sesión normal (usuario y contraseña)
app.post('/login', async (req, res) => {
    const { nombreUsuario, contraseña } = req.body;


    if (!nombreUsuario || !contraseña) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }


    try {
        // Verificar si el usuario existe
        const userQuery = await db.collection('Usuarios')
            .where('NombreUsuario', '==', nombreUsuario)
            .where('Contraseña', '==', contraseña)
            .get();


        if (userQuery.empty) {
            return res.status(401).send({ error: 'Nombre de usuario o contraseña incorrectos' });
        }


        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});


// Endpoint para el inicio de sesión con Google
app.post('/login-google', async (req, res) => {
    const { tokenId } = req.body;

    try {
        // Verify the Google ID token
        const decodedToken = await admin.auth().verifyIdToken(tokenId);
        const uid = decodedToken.uid;

        // Check if the user already exists in Firestore
        const userRef = db.collection('Usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // If user does not exist, create a new user in Firestore
            await userRef.set({
                NombreUsuario: decodedToken.name,
                CorreoElectronico: decodedToken.email
            });
        }

        // Send success response
        res.status(200).send({ success: true });
    } catch (error) {
        // Send error response
        res.status(500).send({ success: false, message: error.message });
    }
});



// Endpoint para obtener los eventos
app.get('/eventos', async (req, res) => {
    try {
        const querySnapshot = await db.collection('Eventos').get();
        res.send(querySnapshot.docs.map(doc => doc.data()));
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener los eventos' });
    }
});


// Endpoint para cargar una vacuna en un día específico
app.post('/vacuna', async (req, res) => {
    const { diaDeEvento, nombreVacuna, notasVacunacion } = req.body;


    if (!diaDeEvento || !nombreVacuna) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }


    const vacunaData = {
        NombreVacuna: nombreVacuna,
        NotasVacunacion: notasVacunacion || '',
        TimestampVacunacion: Timestamp.fromDate(new Date(diaDeEvento)),
        Vacunacion: true,
    };


    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            'vacunacion': FieldValue.arrayUnion(vacunaData)
        }, { merge: true });


        res.send({ success: true, vacunaData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la vacuna' });
    }
});


// Endpoint para cargar medicación en un día específico
app.post('/medicacion', async (req, res) => {
    const { diaDeEvento, nombreMedicamento, cantidadMedicamento, notasMedicamento } = req.body;


    if (!diaDeEvento || !nombreMedicamento || !cantidadMedicamento) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }


    const medicacionData = {
        NombreMedicamento: nombreMedicamento,
        CantidadMedicamento: cantidadMedicamento,
        NotasMedicamento: notasMedicamento || '',
        TimestampMedicacion: Timestamp.fromDate(new Date(diaDeEvento)),
        Medicacion: true,
    };


    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            'medicacion': FieldValue.arrayUnion(medicacionData)
        }, { merge: true });


        res.send({ success: true, medicacionData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la medicación' });
    }
});


// Endpoint para cargar hábitos en un día específico
app.post('/habitos-no-saludables', async (req, res) => {
    const {diaDeEvento, consumoDeAlcohol, consumoDeTabaco} = req.body;


    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }

    const habitosNoSaludables = {
        ConsumoDeAlcohol: consumoDeAlcohol || false,
        ConsumoDeTabaco: consumoDeTabaco || false,
        TimestampHabitosNoSaludables: Timestamp.fromDate(new Date(diaDeEvento)),
    };


    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            'habitos_no_saludables': habitosNoSaludables
        }, { merge: true });


        res.send({ success: true, habitosNoSaludables });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar los hábitos' });
    }
});
app.post('/habitos-saludables', async (req, res) => {
    const { diaDeEvento, actividadFisica, alimentacionSaludable, minSueño } = req.body;
    

    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }


    const habitosSaludables = {
        ActividadFisica: actividadFisica || false,
        AlimentacionSaludable: alimentacionSaludable || false,
        MinSueño: minSueño || false,
        TimestampHabitosSaludables: Timestamp.fromDate(new Date(diaDeEvento)),
    };

    try {
        await db.collection('Eventos').doc(diaDeEvento).set({
            'habitos_saludables': habitosSaludables,
        }, { merge: true });


        res.send({ success: true, habitosSaludables});
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar los hábitos' });
    }
});

app.delete('/evento', async (req, res) => {
    const { diaDeEvento, tipoEvento, nombreMedicamento, nombreVacuna } = req.body;

    if (!diaDeEvento || !tipoEvento) {
        return res.status(400).send({ error: 'Los campos diaDeEvento y tipoEvento son requeridos' });
    }

    try {
        const docRef = db.collection('Eventos').doc(diaDeEvento);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return res.status(404).send({ error: 'El documento no existe' });
        }

        let updateData = {};
        let arrayToUpdate = [];

        switch (tipoEvento) {
            case 'medicacion':
                if (!nombreMedicamento) {
                    return res.status(400).send({ error: 'El campo nombreMedicamento es requerido para eliminar medicación' });
                }
                arrayToUpdate = docSnapshot.data().medicacion || [];
                updateData['medicacion'] = arrayToUpdate.filter(
                    (item) => item.NombreMedicamento !== nombreMedicamento
                );
                break;

            case 'vacunacion':
                if (!nombreVacuna) {
                    return res.status(400).send({ error: 'El campo nombreVacuna es requerido para eliminar vacunación' });
                }
                arrayToUpdate = docSnapshot.data().vacunacion || [];
                updateData['vacunacion'] = arrayToUpdate.filter(
                    (item) => item.NombreVacuna !== nombreVacuna
                );
                break;

            case 'saludables':
                updateData = {
                    'habitos_saludables': {}
                };
                break;

            case 'no_saludables':
                updateData = {
                    'habitos_no_saludables': {}
                };
                break;

            default:
                return res.status(400).send({ error: 'Tipo de evento no reconocido' });
        }

        await docRef.update(updateData);
        res.send({ success: true, message: `El evento ${tipoEvento} ha sido eliminado correctamente` });
    } catch (error) {
        res.status(500).send({ error: 'Error al eliminar el evento', details: error.message });
    }
});
module.exports = app;


