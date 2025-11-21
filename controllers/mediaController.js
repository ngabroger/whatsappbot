const { client } = require ('../index');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');


const sendDocument = async (req, res) => {
    try {
        const { groupId, caption} = req.body;
        const file = req.file;
        if(!groupId || !file) {
            return res.status(400).json({
                success:false,
                message: 'Group id and file are required'
            })
        }
        const media = MessageMedia.fromFilePath(file.path);

        await client.sendMessage(groupId,media, {
            caption: caption || ''
        });

        fs.unlinkSync(file.path);
        res.json({
            success: true,
            message: 'document sent successfully',
            groupId: groupId,
            filename: file.originalname,
        });

    }catch(e){
        if(req.file) fs.unlinkSync(req.file.path);
        console.error('error sending document:', e);
        res.status(500).json({
            success: false,
            message: 'internal server error',
            error: e.message
        });
    }
}

const sendMedia = async (req, res) => {
    try {
        const { groupId, caption} = req.body;
        const file = req.file;
        if(!groupId || !file) {
            return res.status(400).json({
                success:false,
                message: 'group id and media file are required'
            })
        }
        const media = MessageMedia.fromFilePath(file.path);
        await client.sendMessage(groupId, media, {
            caption: caption || ''
        });

        fs.unlinkSync(file.path);
        res.json({
            success: true,
            message: 'media sent successfully',
            groupId: groupId,
            filename: file.originalname,
        })
    }catch(e){
        if(req.file) fs.unlinkSync(req.file.path);
        console.error('error sending media:', e);
        res.status(500).json({
            success: false,
            message: 'internal server error',
            error: e.message
        });
    }
}

module.exports= {sendDocument, sendMedia}