const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { API_ROUTES } = require('./config/routes');
const apiRoutes = require('./routes/api.routes');
const { client } = require('./index');

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(API_ROUTES.HOME, (req, res) => {
    res.json({
        success: true,
        message: 'whatsapp bot api is running',
        version: process.env.VERSION,
        bot: process.env.BOT_NAME
    });
});

// Status endpoint
app.get(API_ROUTES.STATUS, async (req, res) => {
    try {
        const state = await client.getState();
        const info = client.info;
        
        res.json({
            success: true,
            status: state,
            info: info ? {
                pushname: info.pushname,
                platform: info.platform,
                phone: info.wid?.user
            } : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'failed to get status',
            error: error.message
        });
    }
});

app.use('/', apiRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,  
        message: 'endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('server error:', err);
    res.status(500).json({
        success: false,
        message: 'internal server error',
        error: err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API SERVER RUNNING http://localhost:${PORT}`);
    console.log(`🔑 API KEY: ${process.env.API_KEY}`);
    console.log(`📋 BOT: ${process.env.BOT_NAME}`);
});

module.exports = app;