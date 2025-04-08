const express = require('express');
const router = express.Router();
const authMiddleware = require('../Middlewares/authMiddleware');
const {
    createGroupChat,
    getUserGroupChats,
    getGroupChat,
    updateGroupChat
} = require('../Controllers/groupChatController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new group chat
router.post('/create', createGroupChat);

// Get all group chats for the authenticated user
router.get('/list', getUserGroupChats);

// Get a specific group chat
router.get('/:id', getGroupChat);

// Update a group chat
router.put('/:id', updateGroupChat);

module.exports = router; 