const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
require('dotenv').config();

// Initialize WhatsApp Client with Docker-friendly config
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
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Important for Docker
            '--disable-gpu',
            '--disable-extensions',
            '--disable-software-rasterizer'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    }
});

// ==================== EVENTS ====================

client.on('qr', (qr) => {
    console.log('\n📱 Scan QR Code dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 Bot Name: ${process.env.BOT_NAME}`);
    console.log(`📞 Admin: ${process.env.ADMIN_NUMBER}`);
    console.log(`📦 Version: ${process.env.VERSION}`);
    console.log(`🔇 Command Mode: DISABLED (API Only)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    require('./api');
});

client.on('authenticated', () => {
    console.log('🔐 Authentication successful!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
});

client.on('loading_screen', (percent, message) => {
    console.log('⏳ Loading...', percent, message);
});

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        const messageLog = {
            from: contact.pushname || contact.number,
            message: message.body.substring(0, 50), // Limit 50 char untuk privacy
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
    // Log sent messages (dari API)
    if (message.fromMe) {
        console.log('📤 Message sent via API:', message.body.substring(0, 50));
    }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Format uptime to readable string
 */
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

/**
 * Send message to number/group
 */
async function sendMessage(to, text) {
    try {
        // Auto-detect format
        let chatId;
        if(to.includes('@g.us') || to.includes('@c.us')) {
            chatId = to;
        } else {
            chatId = `${to}@c.us`;
        }
        
        await client.sendMessage(chatId, text);
        console.log(`✅ Message sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send media to chat
 */
async function sendMedia(to, mediaPath, caption = '') {
    try {
        // Auto-detect format
        let chatId;
        if(to.includes('@g.us') || to.includes('@c.us')) {
            chatId = to;
        } else {
            chatId = `${to}@c.us`;
        }
        
        const media = MessageMedia.fromFilePath(mediaPath);
        await client.sendMessage(chatId, media, { caption });
        console.log(`✅ Media sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending media:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get client status
 */
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

/**
 * Get all groups
 */
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

// Initialize client
client.initialize();

// Handle process termination
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