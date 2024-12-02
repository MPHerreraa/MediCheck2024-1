const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .banner {
            width: 100%;
            height: auto;
        }
        .content {
            padding: 20px;
        }
        .content h1 {
            color: #007BFF;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #007BFF;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            background: #007BFF;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Imagen del banner -->
        <img src="https://via.placeholder.com/600x200" alt="Banner de bienvenida" class="banner">

        <!-- Contenido principal -->
        <div class="content">
            <h1>¡Bienvenido a [Tu Aplicación]!</h1>
            <p>
                Estamos emocionados de que te unas a nosotros. Ahora tienes acceso a nuestra plataforma donde 
                podrás disfrutar de las mejores herramientas y funcionalidades que hemos diseñado para ti.
            </p>
            <p>
                Si necesitas ayuda o tienes alguna pregunta, no dudes en ponerte en contacto con nuestro equipo de soporte.
            </p>
            <!-- Botón de llamada a la acción -->
            <a href="[URL_DE_LA_APP]" class="button">Explorar la aplicación</a>
        </div>

        <!-- Pie de página -->
        <div class="footer">
            &copy; 2024 [Tu Aplicación]. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;

module.exports = emailHtml;