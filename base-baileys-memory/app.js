const { createBot, createProvider, createFlow, addKeyword, EVENTS, } = require('@bot-whatsapp/bot')
//const axios = require("axios");

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { fetchLatestWaWebVersion } = require('@whiskeysockets/baileys')

//FLUJOS TERCIARIOS
const flujoUbicacion = addKeyword("1", "uno")
.addAnswer(["Estamos ubicados en Jujuy 498 📌", 
            "*- Link a maps*: https://maps.app.goo.gl/iEojznCNwk9Wcbtb8"])
.addAnswer("Muchas gracias por comunicarte con nosotros! 😊. Estoy a tu disposición ante cualquier duda o consulta !Saludos!👋")


const flujoDescripcion = addKeyword("2", "dos")
.addAnswer("Somos una empresa dedicada a la venta de insumos médicos de alta calidad, comprometida con la salud y bienestar de nuestros clientes 😁🧑‍⚕️🚑")
.addAnswer("Muchas gracias por comunicarte con nosotros! 😊. Estoy a tu disposición ante cualquier duda o consulta !Saludos!👋")


const flujoEnvios = addKeyword("3", "Tres")
.addAnswer(["Sí, hacemos envíos a todo el país por medio de CorreoArgentino 🚚"])
.addAnswer("Muchas gracias por comunicarte con nosotros! 😊. Estoy a tu disposición ante cualquier duda o consulta !Saludos!👋")

const flujoOperador = addKeyword("operador")
.addAnswer(
    "Obteniendo datos del operador...",
    {capture:false},
    async (ctx, {fallBack, flowDynamic}) => {
        const operador = await getDatosOperador();
        console.log(operador.name.first)
        if (!operador) {
            await flowDynamic([{ body: 'No se pudieron obtener los datos del operador. Intente nuevamente más tarde.' }]);
            return fallBack();
        }
        await flowDynamic([
            { body:`*Datos del operador:*\n- Nombre: ${operador.name.first}\n- Apellido: ${operador.name.last}\n- Correo: ${operador.email}\n- Teléfono: ${operador.phone}`}
        ]);
    }
)


//FLUJOS SECUNDARIOS
const flujoHorarios = addKeyword(["1", "uno"])
.addAnswer([
    "*Horarios de atencion 🕒:*",
    "- Lunes a viernes: 9hs a 13hs y de 16hs a 20hs", 
    "- Sabados: 9hs a 13hs", 
    "- Domingo: cerrado"]
)
.addAnswer("Muchas gracias por comunicarte con nosotros! 😊. Estoy a tu disposición ante cualquier duda o consulta !Saludos!👋")

const flujoPreguntas = addKeyword("2", "dos")
.addAnswer([
    "*Preguntas frecuentes* 🤔:",
    "*1-* Donde estamos ubicados? 📌",
    "*2-* Quienes somos? 🤨",
    "*3-* Hacen envios a otra provincia? 🗺️"], 
    {capture: true}, 
    async (ctx, {fallBack, flowDynamic})=>{
        const msg = parseInt(ctx.body.toLowerCase().trim());
        if (msg>=1 && msg<=3){
            return;
        }
        await flowDynamic([
            { body: 'Opción no válida, por favor seleccione una opción válida.' }
        ]);
        return  fallBack();
    },
    [flujoUbicacion, flujoDescripcion, flujoEnvios])

const flujoCanalesConstacto = addKeyword(["3", "tres"])
.addAnswer([
    "*Canales de contacto* 📞",
    "- Instagram: https://www.instagram.com/", 
    "- Facebook: https://www.facebook.com/", 
    "- Telefono: 2613613160",
    "Escriba *operador* para obtener medios de comunicacion con un operador ☎️👨👩"],
    {capture: true}, 
    async (ctx, {flowDynamic}) => {
        const msg = ctx.body.toLowerCase().trim();
        if (msg=="operador"){
            return ;
        }
        await flowDynamic([
            {body: "Muchas gracias por comunicarte con nosotros! 😊. Estoy a tu disposición ante cualquier duda o consulta !Saludos!👋"}
        ])
    }, [flujoOperador])

//FLUJO PRINCIPAL

const flujoPrincipal = addKeyword(EVENTS.WELCOME).addAnswer("Hola 😃, soy el asistente virtual de RST, que deseas hacer?")
.addAnswer([
    "Seleccione el *numero de opción:*",
    "*1-* Ver horarios de atencion 🕒",
    "*2-* Preguntas frecuentes 🤔",
    "*3-* Canales de contacto 📞"], 
    {capture: true},
    async (ctx, {fallBack, flowDynamic})=>{
        const msg = parseInt(ctx.body.toLowerCase().trim());
        if (msg>=1 && msg<=3){
            return;
        }
        await flowDynamic([
            { body: 'Opción no válida, por favor seleccione una opción válida.' }
        ]);
        return  fallBack();
    }, 
    [flujoHorarios, flujoPreguntas, flujoCanalesConstacto])


// ------------ Get Operador
const getDatosOperador = async () => {
    try{
        const response = await fetch('https://randomuser.me/api/');
        const data = await response.json();
        const operador = data.results[0]
        return operador;
    }
    catch (e){
        console.error(e);
        return null;
    }

}

//MAIN

const main = async () => {

    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flujoPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        database:adapterDB,
        provider: adapterProvider
    })

    QRPortalWeb()
    
}
main()