const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check auth directory
const authPath = path.join(__dirname, '.wwebjs_auth');
console.log('🔍 Checking auth directory:', authPath);
console.log('📁 Auth directory exists:', fs.existsSync(authPath));

if (!fs.existsSync(authPath)) {
    console.log('📁 Creating auth directory...');
    fs.mkdirSync(authPath, { recursive: true });
}

// ==================== START API SERVER FIRST ====================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Starting API Server...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Start API server immediately
require('./api');

// ==================== THEN INITIALIZE CLIENT ====================

// Initialize WhatsApp Client
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
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--disable-background-networking',
            '--disable-default-apps'
        ]
    }
});

// ==================== EVENTS ====================

// Event: QR Code
client.on('qr', (qr) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SCAN QR CODE DI BAWAH INI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    qrcode.generate(qr, { small: true });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CARA SCAN:');
    console.log('1. Buka WhatsApp di ponsel');
    console.log('2. Tap Menu (⋮) atau Settings');
    console.log('3. Tap Linked Devices');
    console.log('4. Tap Link a Device');
    console.log('5. Scan QR Code di atas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Event: Authenticated
client.on('authenticated', () => {
    console.log('🔐 Authentication successful!');
    console.log('💾 Session saved to .wwebjs_auth');
});

// Event: Ready
client.on('ready', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ WhatsApp Client is READY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 Bot Name: ${process.env.BOT_NAME}`);
    console.log(`📞 Admin: ${process.env.ADMIN_NUMBER}`);
    console.log(`📦 Version: ${process.env.VERSION}`);
    console.log(`🌐 API Port: ${process.env.API_PORT || 3000}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Event: Authentication Failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// Event: Disconnected
client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
});

// Event: Loading Screen
client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading... ${percent}% - ${message}`);
});

// Event: Message Received
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        const messageLog = {
            from: contact.pushname || contact.number,
            message: message.body.substring(0, 50),
            isGroup: chat.isGroup,
            groupName: chat.isGroup ? chat.name : null,
            timestamp: new Date().toISOString()
        };
        
        console.log('📨 Message Received:', JSON.stringify(messageLog, null, 2));
        
    } catch (error) {
        console.error('❌ Error logging message:', error);
    }
});

// Event: Message Create
client.on('message_create', async (message) => {
    if (message.fromMe) {
        console.log('📤 Message sent via API:', message.body.substring(0, 50));
    }
});

// ==================== HELPER FUNCTIONS ====================

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let uptime = '';
    if (days > 0) uptime += `${days}d `;
    if (hours > 0) uptime += `${hours}h `;
    if (minutes > 0) uptime += `${minutes}m `;
    uptime += `${secs}s`;
    
    return uptime;
}

async function sendMessage(to, text) {
    try {
        let chatId = to.includes('@') ? to : `${to}@c.us`;
        await client.sendMessage(chatId, text);
        console.log(`✅ Message sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
    }
}

async function sendMedia(to, mediaPath, caption = '') {
    try {
        let chatId = to.includes('@') ? to : `${to}@c.us`;
        const media = MessageMedia.fromFilePath(mediaPath);
        await client.sendMessage(chatId, media, { caption });
        console.log(`✅ Media sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending media:', error);
        return { success: false, error: error.message };
    }
}

async function getStatus() {
    try {
        const state = await client.getState();
        const info = client.info;
        return {
            success: true,
            state,
            info: info ? {
                pushname: info.pushname,
                platform: info.platform,
                phone: info.wid?.user
            } : null,
            uptime: formatUptime(process.uptime()),
            memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllGroups() {
    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(group => ({
                id: group.id._serialized,
                name: group.name,
                participants: group.participants.length
            }));
        return { success: true, groups };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==================== INITIALIZATION ====================

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Initializing WhatsApp Client...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`📌 Bot Name: ${process.env.BOT_NAME}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

client.initialize().catch(err => {
    console.error('❌ Failed to initialize WhatsApp client:', err);
    // Don't exit, API server still running
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️ Shutting down gracefully...');
    try {
        await client.destroy();
    } catch (e) {
        console.log('Client already destroyed');
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️ Shutting down gracefully...');
    try {
        await client.destroy();
    } catch (e) {
        console.log('Client already destroyed');
    }
    process.exit(0);
});

// ==================== EXPORTS ====================

module.exports = {
    client,
    sendMessage,
    sendMedia,
    getStatus,
    getAllGroups,
    formatUptime
};