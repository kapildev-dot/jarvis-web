const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

router.get('/', async (req, res, next) => {
    try {
        const { location } = req.query;
        const data = await weatherService.getWeather(location || 'Local');
        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;