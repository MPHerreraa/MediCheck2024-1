// Importación de express (framework web para Node.js) y morgan (middleware para registrar peticiones HTTP)
const express = require('express'); 
const morgan = require('morgan'); 

// Importación de la constante db del archivo firebase.js 
const {db} = require('./firebase') 

// Declaración de la constante app, la cual permite utilizar express 
const app = express(); 


app.use(morgan('dev')) 

// En cuanto carga la página, se realiza una petición GET 
app.get('/', async (req, res) => {
    // Se guardan los valores de la colección Eventos en la constante querySnapshot (lo primero que se verá en la página)
    const querySnapshot = await db.collection('Eventos').get()

    // Se imprimen por consola el nombre y el valor de los elementos de querySnapshot 
    console.log(querySnapshot.docs[0].data()); 

    // Envía una respuesta a la petición diciendo "Hola"
    res.send('Hola')
})

// Exporta la constante app para que ezpress pueda ser utilizado en otros archivos
module.exports = app;