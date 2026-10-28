const express = require('express');
const router = express.Router();
const transitService = require('../services/transitService');

router.get('/', async (req, res, next) => {
    try {
        const data = await transitService.getTransitData(req.query);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;