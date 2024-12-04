const express = require('express');

const eventos = express.Router();


eventos.get('/', verifyToken, async (req, res) => {
    try {
        const eventosSnapshot = await db.collection('Usuarios').doc(req.uid).collection('Eventos').get();
        const eventos = eventosSnapshot.docs.map(doc => doc.data());
        res.send(eventos);
    } catch (error) {
        res.status(500).send({ error: 'Error al obtener los eventos' });
    }
});


eventos.post('/vacuna', verifyToken, async (req, res) => {
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
        const userDoc = await db.collection('Usuarios').doc(req.uid).get();
        enviarCorreo('Creación de evento vacuna', userDoc.data().CorreoElectronico, 'Se ha agendado una vacuna exitosamente en el calendario de Medicheck' ) 
        res.send({ success: true, vacunaData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error al registrar la vacuna' });
    }
    
});

// Endpoints de medicación
eventos.post('/medicacion', verifyToken, async (req, res) => {
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
        const userDoc = await db.collection('Usuarios').doc(req.uid).get();
        enviarCorreo('Creación de evento medicacion', userDoc.data().CorreoElectronico, 'Se ha agendado un medicamento exitosamente en el calendario de Medicheck' ) 
        res.send({ success: true, medicacionData });
    } catch (error) {
        res.status(500).send({ error: 'Error al registrar la medicación' });
    }
});

// Endpoints de hábitos
eventos.post('/habitos-no-saludables', verifyToken, async (req, res) => {
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


eventos.post('/habitos-saludables', verifyToken, async (req, res) => {
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

eventos.put('/delete', verifyToken, async (req, res) => {
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

        //switch case
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

module.exports = eventos;