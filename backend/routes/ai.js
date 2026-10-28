const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const aiService = require('../services/aiService');

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        error: 'AI rate limit exceeded.'
    }
});

router.post('/chat', aiLimiter, async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing message.'
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Message too long.'
            });
        }

        const response =
            await aiService.generateAIResponse(message, context);

        res.json(response);

    } catch (error) {
        next(error);
    }
});

module.exports = router;