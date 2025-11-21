require('dotenv').config();

const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid API Key',
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('✅ API Key validated');
    next();
};

const authenticateAdmin = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Admin access required'
        });
    }
    
    next();
};

module.exports = { authenticateAPI, authenticateAdmin };