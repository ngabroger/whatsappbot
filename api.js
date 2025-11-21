const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const { API_ROUTES } = require('./config/routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Global QR code storage
global.latestQR = null;
global.io = io;

app.get(API_ROUTES.HOME, (req, res) => {
    res.json({
        success: true,
        message: 'whatsapp bot api is running',
        version: process.env.VERSION,
        bot: process.env.BOT_NAME,
        qr_page: `http://localhost:${PORT}/qr`
    });
});

app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

app.get(API_ROUTES.STATUS, async (req, res) => {
    try {
        const { client } = require('./index');
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

io.on('connection', (socket) => {
    console.log('🔌 Client connected to QR page');
    
    if (global.latestQR) {
        socket.emit('qr', global.latestQR);
    }
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected from QR page');
    });
});

server.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 API SERVER RUNNING http://localhost:${PORT}`);
    console.log(`📱 QR CODE PAGE: http://localhost:${PORT}/qr`);
    console.log(`🔑 API KEY: ${process.env.API_KEY}`);
    console.log(`📋 BOT: ${process.env.BOT_NAME}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = { app, io, server };