const express = require('express');
const router = express.Router();

const { API_ROUTES } = require('../config/routes');
const { authenticateAPI } = require('../middleware/auth');
const upload = require('../config/multer');

const messageController = require('../controllers/messageController');
const groupController = require('../controllers/groupController');
const mediaController = require('../controllers/mediaController');

// Message Routes - Simplified (Auto-detect personal or group)
router.post(API_ROUTES.SEND_MESSAGE, authenticateAPI, messageController.sendMessage);
router.post(API_ROUTES.BROADCAST, authenticateAPI, messageController.broadcast);
router.post(API_ROUTES.SEND_MESSAGE_MEDIA, authenticateAPI, messageController.sendMessageWithMedia);

// Group Routes
router.get(API_ROUTES.GETALLGROUP, authenticateAPI, groupController.getAllGroups);
router.get(API_ROUTES.GETGROUPINFO, authenticateAPI, groupController.getGroupInfo);

// Media Routes (with file upload)
router.post(API_ROUTES.SEND_DOCUMENT, authenticateAPI, upload.single('file'), mediaController.sendDocument);
router.post(API_ROUTES.SEND_MEDIA, authenticateAPI, upload.single('media'), mediaController.sendMedia);

module.exports = router;
