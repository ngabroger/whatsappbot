const { client } = require('../client');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');

const sendDocument = async (req, res) => {
    try {
        const { to, groupId, caption } = req.body; // Tambah "to" untuk nomor HP
        const file = req.file;
        
        // Support "to" (nomor) atau "groupId" (backward compatible)
        const destination = to || groupId;
        
        if (!destination || !file) {
            return res.status(400).json({
                success: false,
                message: 'to (or groupId) and file are required',
                example: {
                    personal: { to: "6285861585955", caption: "Document caption" },
                    group: { to: "120363xxxxx@g.us", caption: "Document caption" }
                }
            });
        }
        
        // Format chat ID
        let chatId;
        let type;
        
        if (destination.includes('@g.us')) {
            chatId = destination;
            type = 'group';
        } else if (destination.includes('@c.us')) {
            chatId = destination;
            type = 'personal';
        } else {
            chatId = `${destination}@c.us`;
            type = 'personal';
        }
        
        const media = MessageMedia.fromFilePath(file.path);

        await client.sendMessage(chatId, media, {
            caption: caption || '',
            sendSeen: false
        });

        fs.unlinkSync(file.path);
        
        res.json({
            success: true,
            message: 'document sent successfully',
            to: destination,
            chatId: chatId,
            type: type,
            filename: file.originalname,
            timestamp: new Date().toISOString()
        });

        console.log(`✅ Document sent to ${type}: ${destination}`);

    } catch (e) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('error sending document:', e);
        res.status(500).json({
            success: false,
            message: 'failed to send document',
            error: e.message
        });
    }
};

const sendMedia = async (req, res) => {
    try {
        const { to, groupId, caption } = req.body; // Tambah "to" untuk nomor HP
        const file = req.file;
        
        // Support "to" (nomor) atau "groupId" (backward compatible)
        const destination = to || groupId;
        
        if (!destination || !file) {
            return res.status(400).json({
                success: false,
                message: 'to (or groupId) and media file are required',
                example: {
                    personal: { to: "6285861585955", caption: "Image caption" },
                    group: { to: "120363xxxxx@g.us", caption: "Image caption" }
                }
            });
        }
        
        // Format chat ID
        let chatId;
        let type;
        
        if (destination.includes('@g.us')) {
            chatId = destination;
            type = 'group';
        } else if (destination.includes('@c.us')) {
            chatId = destination;
            type = 'personal';
        } else {
            chatId = `${destination}@c.us`;
            type = 'personal';
        }
        
        const media = MessageMedia.fromFilePath(file.path);
        
        await client.sendMessage(chatId, media, {
            caption: caption || ''
        });

        fs.unlinkSync(file.path);
        
        res.json({
            success: true,
            message: 'media sent successfully',
            to: destination,
            chatId: chatId,
            type: type,
            filename: file.originalname,
            timestamp: new Date().toISOString()
        });

        console.log(`✅ Media sent to ${type}: ${destination}`);

    } catch (e) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('error sending media:', e);
        res.status(500).json({
            success: false,
            message: 'failed to send media',
            error: e.message
        });
    }
};

module.exports = { sendDocument, sendMedia };