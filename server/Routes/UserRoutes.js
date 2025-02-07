const express = require('express');

const { signUp,
        login,
        logout,
        getUsers,
        getUserById,
        updateStatus,
        editProfile,
        verifyPassword
} = require('../Controllers/userController');

const authMiddleware = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/uploadMiddleware');

const router = express.Router();

router.post('/signup', upload, signUp);
router.post('/login', login);
router.post('/logout/:id', authMiddleware, logout);
// router.get('/get', authMiddleware, getUsers); if with auth
router.get('/get',  getUsers);
router.get('/get/:id', authMiddleware, getUserById);
router.put('/updateStatus/:id', authMiddleware, updateStatus);
router.put('/editProfile/:id', authMiddleware, upload, editProfile);
router.post('/verifyPassword/:id', authMiddleware, verifyPassword);

module.exports = router;