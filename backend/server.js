require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
// Adjusted Helmet settings to prevent blocking local Live Server connections
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
})); 

// FIX 1: Changed CORS origin to `true` to dynamically reflect the requesting origin.
// This properly accepts requests from Live Server and prevents the '*' array trap.
app.use(cors({
    origin: true, 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '50kb' })); // Prevent large payloads

// General Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api', globalLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: 'KAPISH JARVIS API' });
});

// Mount Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/transit', require('./routes/transit'));
app.use('/api/calendar', require('./routes/calendar'));

// Global Error Handler
app.use(errorHandler);

// FIX 2: Explicitly binding to '127.0.0.1' ensures Node.js uses IPv4, matching your frontend's fetch URLs exactly.
app.listen(PORT, '127.0.0.1', () => {
    console.log(`JARVIS Backend Core running at http://127.0.0.1:${PORT}`);
});