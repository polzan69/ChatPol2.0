const express = require('express');

const { signUp,
        login,
        getUsers,
        getUserById,
        updateStatus
} = require('../Controllers/userController');

const authMiddleware = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/uploadMiddleware');

const router = express.Router();

router.post('/signup', upload, signUp);
router.post('/login', login);
// router.get('/get', authMiddleware, getUsers); if with auth
router.get('/get',  getUsers);
router.get('/get/:id', authMiddleware, getUserById);
router.put('/updateStatus/:id', authMiddleware, updateStatus);

module.exports = router;