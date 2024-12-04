const express = require('express');

const habitos = express.Router();

eventos.post('/no-saludable', verifyToken, async (req, res) => {
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


eventos.post('/saludable', verifyToken, async (req, res) => {
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

module.exports = habitos;