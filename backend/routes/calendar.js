const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');

router.get('/events', async (req, res, next) => {
    try {
        const data = await calendarService.getEvents();
        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;