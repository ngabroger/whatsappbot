const express = require('express');
const router = express.Router();
const { client } = require('../client'); // Import dari client.js

const { API_ROUTES } = require('../config/routes');
const { authenticateAPI } = require('../middleware/auth');
const upload = require('../config/multer');

const messageController = require('../controllers/messageController');
const groupController = require('../controllers/groupController');
const mediaController = require('../controllers/mediaController');

// Home
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WhatsApp Bot API',
        bot: process.env.BOT_NAME,
        version: process.env.VERSION,
        endpoints: {
            status: '/api/status',
            sendMessage: '/api/send-message',
            broadcast: '/api/broadcast',
            sendMedia: '/api/send-message-media',
            groups: '/api/group'
        }
    });
});

// Status
router.get(API_ROUTES.STATUS, async (req, res) => {
    try {
        const state = await client.getState();
        const info = client.info;
        
        res.json({
            success: true,
            status: state,
            bot: process.env.BOT_NAME,
            info: info ? {
                pushname: info.pushname,
                platform: info.platform,
                phone: info.wid?.user
            } : null,
            uptime: process.uptime(),
            memory: process.memoryUsage().heapUsed / 1024 / 1024
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message
        });
    }
});

// Message Routes
router.post(API_ROUTES.SEND_MESSAGE, authenticateAPI, messageController.sendMessage);
router.post(API_ROUTES.BROADCAST, authenticateAPI, messageController.broadcast);
router.post(API_ROUTES.SEND_MESSAGE_MEDIA, authenticateAPI, messageController.sendMessageWithMedia);
// Group Routes
router.get(API_ROUTES.GETALLGROUP, authenticateAPI, groupController.getAllGroups);
router.get(API_ROUTES.GETGROUPINFO, authenticateAPI, groupController.getGroupInfo);

// Media Routes
router.post(API_ROUTES.SEND_DOCUMENT, authenticateAPI, upload.single('file'), mediaController.sendDocument);
router.post(API_ROUTES.SEND_MEDIA, authenticateAPI, upload.single('media'), mediaController.sendMedia);

// Personal Message Route
router.post(API_ROUTES.SEND_PERSONAL_MESSAGE, authenticateAPI, messageController.sendPersonalMessage);

module.exports = router;
