const express = require('express');

const auth = express.Router();

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
        const userDoc = await db.collection('Usuarios').doc(req.uid).get();
        console.log(userDoc)
        enviarCorreo('Creación de cuenta en MediCheck', userDoc.data().CorreoElectronico, 'Se ha creado una cuenta exitosamente en Medicheck' )

        res.status(200).send({ 
            success: true,
            rol: rol,
            CorreoElectronico: correoElectronico,
            NombreUsuario: nombreUsuario
         });
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

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        res.status(200).send({ 
            success: true, 
            rol: userData.rol,
            CorreoElectronico: userData.CorreoElectronico,
            NombreUsuario: userData.NombreUsuario
        });
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
        const userData = userDoc.data();

        if (!userDoc.exists) {
            await userRef.set({
                NombreUsuario: decodedToken.name,
                CorreoElectronico: decodedToken.email,
                rol: 'patient' // Por defecto, los usuarios de Google son pacientes
            });
        }

        res.status(200).send({ 
            success: true, 
            rol: userData.rol,
            CorreoElectronico: userData.CorreoElectronico,
            NombreUsuario: userData.NombreUsuario
        });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = auth;