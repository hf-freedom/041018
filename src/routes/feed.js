const express = require('express');
const { getFeed } = require('../controllers/feedController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getFeed);

module.exports = router;
