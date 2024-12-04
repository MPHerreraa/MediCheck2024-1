const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const { db } = require('./src/firebase');
const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const emailHtml =  require('./htmls/register-email')

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

const eventosRoute = require('./routes/eventos');
app.use('/eventos', eventosRoute);

const authRoute = require('./routes/auth');
app.use('/eventos', authRoute);

//mail
const transporter = nodemailer.createTransport(sgTransport({
  auth: {
    api_key: process.env.EMAIL_API_KEY
  }
}));

function enviarCorreo(asunto, correoElectronico, text ) {
    console.log('Se entro a enviarCorreo')

    const mailOptions = {
        from: 'medicheck2024@gmail.com',
        to: correoElectronico,
        subject: asunto,
        text:text
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error al enviar el correo:', error);
        } else {
          console.log('Correo enviado:', info.response);
        }
      });
  }

const formatDateToDocId = (isoDate) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'long',
        timeStyle: 'medium',
        hour12: true, 
        timeZone: 'America/Argentina/Buenos_Aires', 
    }).format(date) + " UTC-3"; 
};

//token de verificacion. no permite acceso al back si no existe --> wrapper
export async function verifyToken(req, res, next) {
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
//checkea el rol del usuario --> wrapper
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

// Endpoints de roles y acceso
app.get('/role', verifyToken, async (req, res) => {
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});