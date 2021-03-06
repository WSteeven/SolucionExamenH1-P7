const express = require('express');
const app = express();

app.use(express.static('client'));
const server = app.listen('Server on port 3000', (res, req)=>{
    res.send("Hola, hoy usaremos la api de gmail");
});

const io = require('socket.io')(server);


var usuario = [{
    alias: "",
    imagen: ""
}];
var registros_archivados = [];
var registros_eliminados = [];
var lista_de_mensajes = [];
var mailOptions = {
    from: 'wcordova_est@utmachala.edu.ec',
    to: 'wilson972906@gmail.com',
    subject: 'Pruebas',
    text: 'Pruebas con la API de Gmail'
};

//El servidor y la configuración
const gmailSender = require('gmail-sender-oauth'); //Gmail sender https://www.npmjs.com/package/gmail-sender-oauth
//ver https://www.npmjs.com/package/@readdle/googleapis
//ver https://www.npmjs.com/package/googleapis 
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis'); //api de google
gmailSender.setClientSecretsFile('./credentials.json');


io.on('connection', function(socket){
    const address = socket.handshake.address;
    console.log('El cliente: '+address+' se ha conectado');
    socket.emit('datos_usuario', usuario);

    socket.on('add_message', function(data){
        console.log(data);
        usuario = [{
            alias: data.alias,
            imagen: data.imagen
        }];
        console.log(usuario);
        socket.emit('datos_usuario', usuario);
    });

    //Poner en eliminados
    socket.on('adjuntar_en_eliminados', function(data){
        registros_eliminados.push(data);
        console.log("Eliminados: "+registros_eliminados);
        console.log('-------------------')
        socket.emit('registros_eliminados', registros_eliminados);
    });
    //Poner en archivados
    socket.on('adjuntar_en_archivados', function(data){
        registros_archivados.push(data);
        console.log(registros_archivados);
        console.log('---------------------');
        socket.emit('registros_archivados', registros_archivados);
    });

    //escuchando al cliente
    socket.on('add_email', function(data){
        console.log(data);
        mailOptions = {
            from: data.from,
            to: data.to,
            subject: data.subject,
            text: data.text
        };
        console.log(mailOptions);
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'wcordova_est@utmachala.edu.ec',
                pass: '0750360919@Sti'
            }
        });
        //enviamos el email
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                res.send(500, error.message);
            } else {
                console.log('Email enviado');
                res.status(200).jsonp(req.body);
            }
        });
    });
    //Si se modifica el scope, borrar el token.json
    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    //El archivo token.json almacena la cuenta de acceso del usuario y refresca los tokens, 
    //y es creado automaticamente cuando el flujo de autorizacion se completa en la primera vez
    const TOKEN_PATH = 'token.json';

    //Carga de las credenciales del cliente desde un archivo local
    fs.readFile('./credentials.json', (err, content)=>{
        if(err) return console.log('Error cargando las credenciales del cliente: ', err);
        //Autorizar el cliente con las credenciales, luego llamar a la API de Gmail
        autorize(JSON.parse(content), listLabels); //método para leer las etiquetas de gmail
    });

    /**
     * Crear un cliente oauth2 con las credenciales json y luego ejecute las funciones de callback
     * @param {Object} credentials Las credenciales de autorización del cliente
     * @param {function} callback Las devoluciones de llamada para el cliente autorizado.
     */
    function autorize(credentials, callback){
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);
        
        //Comprobar si se tiene almacenado previamente un token
        fs.readFile(TOKEN_PATH, (err, token) => {
            if(err) return getNewToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }
    /**
     * Obtener y almacenar un nuevo token despues de solicitar la autenticación de usuario, y luego
     * ejecuta la devolución de llamada dada con el cliente oAuth2 autorizado
     * @param {google.auth.OAuth2} oAuth2Client El cliente OAuth2 para el que se obtiene el token.
     * @param {getEventsCallback} callback La devolución de llamada para el cliente autorizado.
     */
    function getNewToken(oAuth2Client, callback){
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Autoriza esta app visitando esta url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Ingresa el código obtenido de la página aquí: ', (code)=>{
            rl.close();
            oAuth2Client.getToken(code, (err, token)=>{
                if(err) return console.error('Error obteniendo el token de acceso', err);
                oAuth2Client.setCredentials(token);
                //Almacenar el token en el disco para las próximas ejecuciones de los programas
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err)=>{
                    if(err) return console.error(err);
                    console.log('Token almacenado en', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        });
    }

    /**
     * Listar las etiquetas obtenidas en la cuenta del usuario.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function listLabels(auth){
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res)=>{
            if(err) return console.log('La API ha retornado un error: '+err);
            const labels = res.data.labels;
            if(labels.length){
                console.log('Etiquetas (categorías):');
                labels.forEach((label)=>{
                    console.log(`-> ${label.name}`);
                });
            } else {
                console.log('No se encontraron etiquetas')
            }
        });
    }
});
















