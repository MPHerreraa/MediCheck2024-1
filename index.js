// Declaración de la constante app, la cual se importa desde el archivo spp.js
const app = require('../MediCheck2024/app') 

// Importación y ejecución del archivo firebase.js para comprobar su correcta inicialización 
require('./firebase')

// Inicialización de express en el puerto 3000 
app.listen(3000) 
console.log('Server is running on port 3000')