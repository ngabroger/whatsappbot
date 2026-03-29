const { Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require
require('dotenv').config();
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-safebrowsing',
            '--disable-web-security',
            '--v=99',
            '--single-process',
            '--disk-cache-size=0',
            '--media-cache-size=0',
            '--js-flags="--max-old-space-size=512"'
        ]
    }
})

module.exports = { client };