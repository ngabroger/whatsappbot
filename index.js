const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
require('dotenv').config();

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
client.on('qr', async (qr) => {
    console.log('\n📱 QR Code generated!');
    console.log(`🌐 Open browser: http://localhost:${process.env.PORT || 3000}/qr`);
    
    try {
        // Generate QR code as data URL
        const qrDataUrl = await qrcode.toDataURL(qr);
        
        // Store latest QR
        global.latestQR = qrDataUrl;
        
        // Emit to all connected clients
        if (global.io) {
            global.io.emit('qr', qrDataUrl);
            console.log('✅ QR Code sent to web interface');
        }
    } catch (error) {
        console.error('❌ Error generating QR:', error);
    }
});

// Event: Ready
client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 Bot Name: ${process.env.BOT_NAME}`);
    console.log(`📞 Admin: ${process.env.ADMIN_NUMBER}`);
    console.log(`📦 Version: ${process.env.VERSION}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Clear QR code
    global.latestQR = null;
    
    // Emit ready status
    if (global.io) {
        global.io.emit('ready', {
            message: 'WhatsApp connected!',
            bot: process.env.BOT_NAME
        });
    }
    
    // Start API Server after bot ready
    require('./api');
});

// Event: Authenticated
client.on('authenticated', () => {
    console.log('🔐 Authentication successful!');
    
    // Clear QR and emit authenticated
    global.latestQR = null;
    if (global.io) {
        global.io.emit('authenticated');
    }
});

// Event: Authentication Failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    
    if (global.io) {
        global.io.emit('auth_failure', { message: msg });
    }
});

// Event: Disconnected
client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
    
    if (global.io) {
        global.io.emit('disconnected', { reason });
    }
});

// Event: Loading Screen
client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading... ${percent}% - ${message}`);
    
    if (global.io) {
        global.io.emit('loading', { percent, message });
    }
});

// Event: Message Received (LOGGING ONLY - NO RESPONSE)
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        // Log incoming message (untuk monitoring)
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

// Event: Message Create (Log sent messages from API)
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

// Initialize client with error handling
console.log('🚀 Starting WhatsApp Bot...');
client.initialize().catch(err => {
    console.error('❌ Failed to initialize WhatsApp client:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️ Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️ Shutting down gracefully...');
    await client.destroy();
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