const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/authMiddleware');

const {
    searchUsers,
    sendFriendRequest,
    handleFriendRequest,
    getFriendRequests,
    getFriends
} = require('../Controllers/friendController');

router.get('/search', auth, searchUsers);
router.post('/request', auth, sendFriendRequest);
router.put('/request/handle', auth, handleFriendRequest);
router.get('/requests', auth, getFriendRequests);
router.get('/list', auth, getFriends);

module.exports = router;