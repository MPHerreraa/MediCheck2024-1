const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { db, admin } = require('./src/firebase');

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.get('/eventos', async (req, res) => {
    const querySnapshot = await db.collection('Eventos').get();
    res.send(querySnapshot.docs.map(doc => doc.data()));
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
        TimestampVacunacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        Vacunacion: true,
    };

    await db.collection('Eventos').doc(diaDeEvento).set({
        Vacunas: admin.firestore.FieldValue.arrayUnion(vacunaData),
        TimestampVacunacion: vacunaData.TimestampVacunacion,
        Vacunacion: true,
    }, { merge: true });

    res.send({ success: true, vacunaData });
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
        TimestampMedicacion: admin.firestore.Timestamp.fromDate(new Date(diaDeEvento)),
        Medicacion: true,
    };

    await db.collection('Eventos').doc(diaDeEvento).set({
        Medicaciones: admin.firestore.FieldValue.arrayUnion(medicacionData),
        TimestampMedicacion: medicacionData.TimestampMedicacion,
        Medicacion: true,
    }, { merge: true });

    res.send({ success: true, medicacionData });
});

// Endpoint para cargar hábitos en un día específico
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

    await db.collection('Eventos').doc(diaDeEvento).set({
        ...habitosSaludables,
        ...habitosNoSaludables
    }, { merge: true });

    res.send({ success: true, habitosSaludables, habitosNoSaludables });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;