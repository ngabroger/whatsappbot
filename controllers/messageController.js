const { client } = require('../client');


const sendMessage = async(req, res) => {
    try{
        const { to, message } = req.body;
        
        if(!to || !message){
            return res.status(400).json({
                success: false,
                message: 'to (number/groupId) and message are required',
                example: {
                    personal: { to: "1029309809809123", message: "Hello" },
                    group: { to: "120363xxxxx@g.us", message: "Hello Group" }
                }
            });
        }

        let chatId;
        let type;
        
        if(to.includes('@g.us')) {
            chatId = to;
            type = 'group';
        } else if(to.includes('@c.us')) {
            chatId = to;
            type = 'personal';
        } else {
            // Cukup gunakan cara lama ini persis seperti di mediaController.
            chatId = `${to}@c.us`;
            type = 'personal';
        }
        
        // HAPUS fungsi checking isRegisteredUser dan getNumberId
        
        await client.sendMessage(chatId, message, { sendSeen: false });
        
        res.json({
            success: true,
            message: 'message sent successfully',
            to: to,
            chatId: chatId,
            type: type,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Message sent to ${type}: ${to}`);
        
    }catch(error){
        console.error('error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error / Program Error',
            detail: error.message || error.toString()
        });
    }
};

/**
 */
const broadcast = async(req, res) => {
    try{
        const { destinations, message, delay = 2000 } = req.body;
        
        if(!destinations || !Array.isArray(destinations) || !message){
            return res.status(400).json({
                success: false,
                message: 'destinations (array) and message are required',
                example: {
                    destinations: ["6285861585955", "120363xxxxx@g.us"],
                    message: "Broadcast message",
                    delay: 2000
                }
            });
        }
        
        const results = [];
        
        for(const dest of destinations){
            try{
                let chatId;
                let type;
                
                if(dest.includes('@g.us')) {
                    chatId = dest;
                    type = 'group';
                } else if(dest.includes('@c.us')) {
                    chatId = dest;
                    type = 'personal';
                } else {
                    // Cukup gunakan cara lama ini persis seperti di mediaController.
                    chatId = `${dest}@c.us`;
                    type = 'personal';
                }
                
                // HAPUS fungsi checking isRegisteredUser dan getNumberId
        
                await client.sendMessage(chatId, message, { sendSeen: false });
                results.push({ 
                    destination: dest, 
                    type: type,
                    status: 'success' 
                });
                
                console.log(`✅ Broadcast sent to ${type}: ${dest}`);
                
                // Delay to avoid spam
                await new Promise(resolve => setTimeout(resolve, delay));
                
            }catch(error){
                results.push({ 
                    destination: dest, 
                    status: 'failed', 
                    error: error.message 
                });
                console.error(`❌ Failed to send to ${dest}:`, error.message);
            }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        
        res.json({
            success: true,
            message: 'broadcast completed',
            total: destinations.length,
            success_count: successCount,
            failed_count: failedCount,
            results: results,
            timestamp: new Date().toISOString()
        });
        
    }catch(error){
        console.error('broadcast error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error / Program Error',
            detail: error.message || error.toString()
        });
    }
};

/**
 *  message with media/document
 */
const sendMessageWithMedia = async(req, res) => {
    try{
        const { to, message, mediaUrl } = req.body;
        
        if(!to || !mediaUrl){
            return res.status(400).json({
                success: false,
                message: 'to and mediaUrl are required'
            });
        }
        
        // Auto-detect chat type
        let chatId;
        if(to.includes('@g.us') || to.includes('@c.us')) {
            chatId = to;
        } else {
            chatId = `${to}@c.us`;
        }
        
        // Download and send media
        const { MessageMedia } = require('whatsapp-web.js');
        const media = await MessageMedia.fromUrl(mediaUrl);
        
        await client.sendMessage(chatId, media, {
            caption: message || '',
            sendSeen: false
        });
        
        res.json({
            success: true,
            message: 'media sent successfully',
            to: to,
            timestamp: new Date().toISOString()
        });
        
    }catch(error){
        console.error('error sending media:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error / Program Error',
            detail: error.message || error.toString()
        });
    }
};

const sendPersonalMessage = async(req, res) => {
    try {
        const { to, message } = req.body;
        
        if(!to || !message){
            return res.status(400).json({
                success: false,
                message: 'to (phone number) and message are required',
                example: { to: "6285861585955", message: "Hello bro" }
            });
        }

        // 1. Pastikan hanya tersisa angka (bersihkan + atau spasi)
        const cleanNumber = to.replace(/\D/g, '');
        const chatId = `${cleanNumber}@c.us`;

        // 2. Cegah error puppeteer dengan mengecek apakah nomor terdaftar di WA
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            return res.status(404).json({
                success: false,
                message: `Nomor ${cleanNumber} tidak terdaftar di WhatsApp.`
            });
        }
        
        // 3. Kirim pesan aman tanpa flag seen
        await client.sendMessage(chatId, message, { sendSeen: false });
        
        res.json({
            success: true,
            message: 'Personal message sent successfully',
            to: cleanNumber,
            chatId: chatId,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Personal Message sent to: ${cleanNumber}`);
        
    } catch(error) {
        console.error('error sending personal message:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error / Program Error',
            detail: error.message || error.toString()
        });
    }
};

module.exports = {
    sendMessage,
    broadcast,
    sendMessageWithMedia,
    sendPersonalMessage
};