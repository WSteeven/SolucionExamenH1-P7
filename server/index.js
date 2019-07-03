//El servidor y la configuración
const gmailSender = require('gmail-sender-oauth'); //Gmail sender https://www.npmjs.com/package/gmail-sender-oauth
//ver https://www.npmjs.com/package/@readdle/googleapis
//ver https://www.npmjs.com/package/googleapis 
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis'); //api de google
gmailSender.setClientSecretsFile('./credentials.json');

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

//Crear un cliente oauth2 con las credenciales json y 