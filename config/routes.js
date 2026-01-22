const API_ROUTES = {
    HOME: '/',
    
    // Message Routes - Simplified
    SEND_MESSAGE: '/api/send-message',           // Support both personal & group
    BROADCAST: '/api/broadcast',                 // Support both personal & group
    SEND_MESSAGE_MEDIA: '/api/send-message-media',
    
    // Document & Media (with file upload)
    SEND_DOCUMENT: '/api/send-document',
    SEND_MEDIA: '/api/send-media',
    
    MARK_UNREAD: '/api/mark-unread',

    // Group Routes
    GETALLGROUP: '/api/group',
    GETGROUPINFO: '/api/group/info',
    
    // Status
    STATUS: '/api/status',
    HEALTH: '/api/health'
}

const API_VERSION = {
    VERSION: process.env.VERSION || 'v0.01'
}

module.exports = {
    API_ROUTES,
    API_VERSION
};