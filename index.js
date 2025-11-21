const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
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
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// ==================== EVENTS ====================

// Event: QR Code
client.on('qr', (qr) => {
    console.log('\n📱 Scan QR Code dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Event: Ready
client.on('ready', () => {
    console.log('\n✅ WhatsApp Client is ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📌 Bot Name: ${process.env.BOT_NAME}`);
    console.log(`📞 Admin: ${process.env.ADMIN_NUMBER}`);
    console.log(`📦 Version: ${process.env.VERSION}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Start API Server after bot ready
    require('./api');
});

// Event: Authenticated
client.on('authenticated', () => {
    console.log('🔐 Authentication successful!');
});

// Event: Authentication Failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    process.exit(1);
});

// Event: Disconnected
client.on('disconnected', (reason) => {
    console.log('⚠️ Client disconnected:', reason);
});

// Event: Loading Screen
client.on('loading_screen', (percent, message) => {
    console.log('⏳ Loading...', percent, message);
});

// Event: Message Received
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        // Log message
        const messageLog = {
            from: contact.pushname || contact.number,
            message: message.body,
            isGroup: chat.isGroup,
            groupName: chat.isGroup ? chat.name : null,
            timestamp: new Date().toISOString()
        };
        
        console.log('📨 New Message:', JSON.stringify(messageLog, null, 2));
        
        // Handle commands
        if (message.body.startsWith('!')) {
            await handleCommand(message, chat, contact);
        }
    } catch (error) {
        console.error('❌ Error handling message:', error);
    }
});

// Event: Message Create (Sent messages)
client.on('message_create', async (message) => {
    // Log sent messages (optional)
    if (message.fromMe) {
        console.log('📤 Message sent:', message.body);
    }
});

// ==================== COMMAND HANDLER ====================

async function handleCommand(message, chat, contact) {
    const args = message.body.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Check if admin command
    const isAdmin = contact.number === process.env.ADMIN_NUMBER;
    
    try {
        switch (command) {
            case 'ping':
                await message.reply('🏓 Pong!');
                break;
                
            case 'help':
                const helpText = `📋 *Daftar Perintah:*\n\n` +
                    `┌─ *User Commands*\n` +
                    `├ !ping - Cek bot aktif\n` +
                    `├ !help - Tampilkan menu\n` +
                    `├ !info - Info bot\n` +
                    `├ !stiker - Buat stiker dari gambar\n` +
                    `└ !echo [text] - Echo pesan\n\n` +
                    `┌─ *Group Commands*\n` +
                    `├ !getgroupid - Dapatkan ID group\n` +
                    `├ !groupinfo - Info group\n` +
                    `└ !groups - List semua group\n\n` +
                    (isAdmin ? `┌─ *Admin Commands*\n` +
                    `├ !broadcast - Broadcast message\n` +
                    `├ !stats - Bot statistics\n` +
                    `└ !restart - Restart bot\n\n` : '') +
                    `Bot by ${process.env.BOT_NAME}`;
                await message.reply(helpText);
                break;
                
            case 'info':
                const state = await client.getState();
                const info = client.info;
                const botInfo = `ℹ️ *Bot Information:*\n\n` +
                    `📌 Name: ${process.env.BOT_NAME}\n` +
                    `📞 Admin: +${process.env.ADMIN_NUMBER}\n` +
                    `🔄 Status: ${state}\n` +
                    `📦 Version: ${process.env.VERSION}\n` +
                    `📱 Platform: ${info?.platform || 'N/A'}\n` +
                    `⏰ Uptime: ${formatUptime(process.uptime())}`;
                await message.reply(botInfo);
                break;
                
            case 'echo':
                const echoText = args.join(' ');
                if (!echoText) {
                    await message.reply('❌ Usage: !echo [text]');
                } else {
                    await message.reply(echoText);
                }
                break;
                
            case 'stiker':
            case 'sticker':
                if (message.hasMedia) {
                    await message.reply('⏳ Sedang membuat stiker...');
                    const media = await message.downloadMedia();
                    
                    await client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerAuthor: process.env.BOT_NAME,
                        stickerName: 'Stiker'
                    });
                } else if (message.hasQuotedMsg) {
                    const quotedMsg = await message.getQuotedMessage();
                    if (quotedMsg.hasMedia) {
                        await message.reply('⏳ Sedang membuat stiker...');
                        const media = await quotedMsg.downloadMedia();
                        
                        await client.sendMessage(message.from, media, {
                            sendMediaAsSticker: true,
                            stickerAuthor: process.env.BOT_NAME,
                            stickerName: 'Stiker'
                        });
                    } else {
                        await message.reply('❌ Pesan yang di-reply harus berisi gambar!');
                    }
                } else {
                    await message.reply('❌ Kirim gambar dengan caption !stiker atau reply gambar dengan !stiker');
                }
                break;
                
            case 'getgroupid':
                if (chat.isGroup) {
                    const groupInfo = `📋 *Group Info:*\n\n` +
                        `Name: ${chat.name}\n` +
                        `ID: \`${chat.id._serialized}\`\n` +
                        `Participants: ${chat.participants.length}\n\n` +
                        `_Simpan ID ini untuk API!_`;
                    await message.reply(groupInfo);
                } else {
                    await message.reply('❌ Perintah ini hanya bisa digunakan di group!');
                }
                break;
                
            case 'groupinfo':
                if (chat.isGroup) {
                    const participants = chat.participants;
                    const admins = participants.filter(p => p.isAdmin).length;
                    
                    const groupDetail = `📋 *Group Detail:*\n\n` +
                        `📌 Name: ${chat.name}\n` +
                        `🆔 ID: ${chat.id._serialized}\n` +
                        `👥 Members: ${participants.length}\n` +
                        `👑 Admins: ${admins}\n` +
                        `📝 Description: ${chat.description || 'No description'}\n` +
                        `📅 Created: ${chat.createdAt ? new Date(chat.createdAt * 1000).toLocaleDateString() : 'Unknown'}`;
                    await message.reply(groupDetail);
                } else {
                    await message.reply('❌ Perintah ini hanya bisa digunakan di group!');
                }
                break;
                
            case 'groups':
                const chats = await client.getChats();
                const groups = chats.filter(c => c.isGroup);
                
                if (groups.length === 0) {
                    await message.reply('❌ Tidak ada group yang ditemukan!');
                } else {
                    let groupList = `📋 *Daftar Group (${groups.length}):*\n\n`;
                    groups.slice(0, 20).forEach((g, i) => {
                        groupList += `${i + 1}. ${g.name}\n`;
                    });
                    if (groups.length > 20) {
                        groupList += `\n_Dan ${groups.length - 20} group lainnya..._`;
                    }
                    await message.reply(groupList);
                }
                break;
                
            // Admin only commands
            case 'stats':
                if (!isAdmin) {
                    await message.reply('❌ Perintah ini hanya untuk admin!');
                    break;
                }
                
                const allChats = await client.getChats();
                const groupChats = allChats.filter(c => c.isGroup);
                const privateChats = allChats.filter(c => !c.isGroup);
                
                const stats = `📊 *Bot Statistics:*\n\n` +
                    `💬 Total Chats: ${allChats.length}\n` +
                    `👥 Groups: ${groupChats.length}\n` +
                    `👤 Private: ${privateChats.length}\n` +
                    `⏰ Uptime: ${formatUptime(process.uptime())}\n` +
                    `💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
                await message.reply(stats);
                break;
                
            case 'broadcast':
                if (!isAdmin) {
                    await message.reply('❌ Perintah ini hanya untuk admin!');
                    break;
                }
                await message.reply('📢 Gunakan API endpoint /api/broadcast untuk broadcast message');
                break;
                
            default:
                await message.reply('❓ Perintah tidak dikenali. Ketik !help untuk bantuan.');
        }
    } catch (error) {
        console.error('❌ Error executing command:', error);
        await message.reply('⚠️ Terjadi error saat menjalankan perintah!');
    }
}

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
 * Send message to number
 */
async function sendMessage(number, text) {
    try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        await client.sendMessage(chatId, text);
        console.log(`✅ Message sent to ${number}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send media to chat
 */
async function sendMedia(chatId, mediaPath, caption = '') {
    try {
        const media = MessageMedia.fromFilePath(mediaPath);
        await client.sendMessage(chatId, media, { caption });
        console.log(`✅ Media sent to ${chatId}`);
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
            } : null
        };
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
    getStatus
};