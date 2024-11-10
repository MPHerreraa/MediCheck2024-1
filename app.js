const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const { db } = require('./src/firebase');
const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const app = express();
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization'
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'src')));

const formatDateToDocId = (isoDate) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'long',
        timeStyle: 'medium',
        hour12: true, 
        timeZone: 'America/Argentina/Buenos_Aires', 
    }).format(date) + " UTC-3"; 
};

async function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({ error: 'Se requiere autenticación' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.uid = decodedToken.uid;
        next();
    } catch (error) {
        console.log(error)
        res.status(403).send({ error: 'Token inválido' });
    }
}

async function checkDoctorRole(req, res, next) {
    try {
        const userDoc = await db.collection('Usuarios').doc(req.uid).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'Usuario no encontrado' });
        }

        const userData = userDoc.data();
        if (userData.rol !== 'doctor') {
            return res.status(403).send({ error: 'Acceso no autorizado' });
        }

        next();
    } catch (error) {
        res.status(500).send({ error: 'Error al verificar rol de usuario' });
    }
}

// Rutas básicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'login.html'));
});

// Autenticación y registro
app.post('/register', verifyToken, async (req, res) => {
    const { nombreUsuario, correoElectronico, contraseña, rol } = req.body;

    if (!nombreUsuario || !correoElectronico || !contraseña || !rol) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
        const userQuery = await db.collection('Usuarios')
            .where('CorreoElectronico', '==', correoElectronico)
            .get();

        if (!userQuery.empty) {
            return res.status(400).send({ error: 'El correo electrónico ya está registrado' });
        }

        await db.collection('Usuarios').doc(req.uid).set({
            NombreUsuario: nombreUsuario,
            CorreoElectronico: correoElectronico,
            Contraseña: contraseña,
            rol: rol
        }, { merge: true });
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

app.post('/login', verifyToken, async (req, res) => {
    const { correoElectronico, contraseña } = req.body;

    if (!correoElectronico || !contraseña) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
        const userQuery = await db.collection('Usuarios')
            .where('CorreoElectronico', '==', correoElectronico)
            .where('Contraseña', '==', contraseña)
            .get();

        if (userQuery.empty) {
            return res.status(401).send({ error: 'Correo o contraseña incorrectos' });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

app.post('/login-google', async (req, res) => {
    const { tokenId } = req.body;

    try {
        const decodedToken = await admin.auth().verifyIdToken(tokenId);
        const uid = decodedToken.uid;

        const userRef = db.collection('Usuarios').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                NombreUsuario: decodedToken.name,
                CorreoElectronico: decodedToken.email,
                rol: 'patient' // Por defecto, los usuarios de Google son pacientes
            });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// Endpoints de roles y acceso
app.get('/user-role', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('Usuarios').doc(req.uid).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'Usuario no encontrado' });
        }


        const userData = userDoc.data();
        res.send({ role: userData.rol });
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener rol de usuario' });
    }
});

app.get('/patients', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const patientsSnapshot = await db.collection('Usuarios')
            .where('rol', '==', 'patient')
            .get();


        const patients = patientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            Contraseña: undefined
        }));


        res.send(patients);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener lista de pacientes' });
    }
});

// Endpoints de eventos
app.get('/eventos', verifyToken, async (req, res) => {
    try {
        const eventosSnapshot = await db.collection('Usuarios').doc(req.uid).collection('Eventos').get();
        const eventos = eventosSnapshot.docs.map(doc => doc.data());
        res.send(eventos);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener los eventos' });
    }
});

app.get('/patient/:patientId/eventos', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const eventosSnapshot = await db.collection('Usuarios')
            .doc(req.params.patientId)
            .collection('Eventos')
            .get();


        const eventos = eventosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        res.send(eventos);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener eventos del paciente' });
    }
});

// Endpoints de vacunas
app.post('/vacuna', verifyToken, async (req, res) => {
    const { diaDeEvento, nombreVacuna, notasVacunacion } = req.body;

    if (!diaDeEvento || !nombreVacuna) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    const eventDate = new Date(diaDeEvento);
    const formattedDate = `${eventDate.getFullYear()}_${(eventDate.getMonth() + 1).toString().padStart(2, '0')}_${eventDate.getDate().toString().padStart(2, '0')}`;

    const vacunaData = {
        NombreVacuna: nombreVacuna,
        NotasVacunacion: notasVacunacion || '',
        TimestampVacunacion: admin.firestore.Timestamp.fromDate(eventDate),
        Vacunacion: true,
    };

    try {
        await db.collection('Usuarios').doc(req.uid).collection('Eventos').doc(formattedDate).set({
            'vacunacion': admin.firestore.FieldValue.arrayUnion(vacunaData)
        }, { merge: true });

        res.send({ success: true, vacunaData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error al registrar la vacuna' });
    }
});

// Endpoints de medicación
app.post('/medicacion', verifyToken, async (req, res) => {
    const { diaDeEvento, nombreMedicamento, cantidadMedicamento, notasMedicamento } = req.body;

    if (!diaDeEvento || !nombreMedicamento || !cantidadMedicamento) {
        return res.status(400).send({ error: 'Todos los campos son requeridos' });
    }
    const eventDate = new Date(diaDeEvento);
    const formattedDate = `${eventDate.getFullYear()}_${(eventDate.getMonth() + 1).toString().padStart(2, '0')}_${eventDate.getDate().toString().padStart(2, '0')}`;

    const medicacionData = {
        NombreMedicamento: nombreMedicamento,
        CantidadMedicamento: cantidadMedicamento,
        NotasMedicamento: notasMedicamento || '',
        TimestampMedicacion: Timestamp.fromDate(new Date(diaDeEvento)),
        Medicacion: true,
    };

    try {
        await db.collection('Usuarios').doc(req.uid).collection('Eventos').doc(formattedDate).set({
            'medicacion': FieldValue.arrayUnion(medicacionData)
        }, { merge: true });

        res.send({ success: true, medicacionData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la medicación' });
    }
});

// Endpoints de hábitos
app.post('/habitos-no-saludables', verifyToken, async (req, res) => {
    const { diaDeEvento, consumoDeAlcohol, consumoDeTabaco } = req.body;
    const eventDate = new Date(diaDeEvento);
    const formattedDate = `${eventDate.getFullYear()}_${(eventDate.getMonth() + 1).toString().padStart(2, '0')}_${eventDate.getDate().toString().padStart(2, '0')}`;

    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }

    const habitosNoSaludables = {
        ConsumoDeAlcohol: consumoDeAlcohol || false,
        ConsumoDeTabaco: consumoDeTabaco || false,
        TimestampHabitosNoSaludables: Timestamp.fromDate(new Date(diaDeEvento)),
    };

    const allFalse = !habitosNoSaludables.ConsumoDeAlcohol && !habitosNoSaludables.ConsumoDeTabaco;

    try {
        const eventRef = db.collection('Usuarios').doc(req.uid).collection('Eventos').doc(formattedDate);

        if (allFalse) {
            await eventRef.update({
                habitos_no_saludables: FieldValue.delete(),
            });
            res.send({ success: true, message: 'Hábitos no saludables eliminados porque todos son falsos' });
        } else {
            await eventRef.set(
                { habitos_no_saludables: habitosNoSaludables },
                { merge: true }
            );
            res.send({ success: true, habitosNoSaludables });
        }
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar los hábitos no saludables' });
    }
});


app.post('/habitos-saludables', verifyToken, async (req, res) => {
    const { diaDeEvento, actividadFisica, alimentacionSaludable, minSueño } = req.body;
    const eventDate = new Date(diaDeEvento);
    const formattedDate = `${eventDate.getFullYear()}_${(eventDate.getMonth() + 1).toString().padStart(2, '0')}_${eventDate.getDate().toString().padStart(2, '0')}`;

    if (!diaDeEvento) {
        return res.status(400).send({ error: 'El campo diaDeEvento es requerido' });
    }

    const habitosSaludables = {
        ActividadFisica: actividadFisica || false,
        AlimentacionSaludable: alimentacionSaludable || false,
        MinSueño: minSueño || false,
        TimestampHabitosSaludables: Timestamp.fromDate(new Date(diaDeEvento)),
    };

    const allFalse = !habitosSaludables.ActividadFisica && !habitosSaludables.AlimentacionSaludable && !habitosSaludables.MinSueño;

    try {
        const eventRef = db.collection('Usuarios').doc(req.uid).collection('Eventos').doc(formattedDate);

        if (allFalse) {
            await eventRef.update({
                habitos_saludables: FieldValue.delete(),
            });
            res.send({ success: true, message: 'Habitos saludables eliminados porque todos son falsos' });
        } else {
            await eventRef.set(
                { habitos_saludables: habitosSaludables },
                { merge: true }
            );
            res.send({ success: true, habitosSaludables });
        }
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar los hábitos saludables' });
    }
});


// Endpoint para eliminar eventos
app.delete('/evento', verifyToken, async (req, res) => {
    const { diaDeEvento, tipoEvento, nombreMedicamento, nombreVacuna } = req.body;

    if (!diaDeEvento || !tipoEvento) {
        return res.status(400).send({ error: 'Los campos diaDeEvento y tipoEvento son requeridos' });
    }

    try {
        const eventDate = new Date(diaDeEvento);
        const formattedDate = `${eventDate.getFullYear()}_${(eventDate.getMonth() + 1).toString().padStart(2, '0')}_${eventDate.getDate().toString().padStart(2, '0')}`;

        console.log("formattedDate  " + formattedDate)

        const eventoRef = db.collection('Usuarios').doc(req.uid).collection('Eventos').doc(formattedDate);

        const eventoSnapshot = await eventoRef.get();

        if (!eventoSnapshot.exists) {
            return res.status(404).send({ error: 'El evento no existe' });
        }

        const eventoData = eventoSnapshot.data();

        if (tipoEvento === 'vacunacion' && nombreVacuna) {
            const nuevaVacunacion = eventoData.vacunacion.filter(vacuna => vacuna.NombreVacuna !== nombreVacuna);
            await eventoRef.update({ vacunacion: nuevaVacunacion });
        } else if (tipoEvento === 'medicacion' && nombreMedicamento) {
            const nuevaMedicacion = eventoData.medicacion.filter(medicamento => medicamento.NombreMedicamento !== nombreMedicamento);
            await eventoRef.update({ medicacion: nuevaMedicacion });
        } else if (tipoEvento === 'habitos_saludables') {
            await eventoRef.update({ habitos_saludables: admin.firestore.FieldValue.delete() });
        } else if (tipoEvento === 'habitos_no_saludables') {
            await eventoRef.update({ habitos_no_saludables: admin.firestore.FieldValue.delete() });
        } else {
            return res.status(400).send({ error: 'Tipo de evento no válido' });
        }

        res.send({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error al eliminar el evento' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});