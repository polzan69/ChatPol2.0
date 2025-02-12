const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/authMiddleware');
const { getMessages, sendMessage } = require('../Controllers/messageController');

router.get('/:userId', auth, getMessages);
router.post('/send', auth, sendMessage);

module.exports = router;