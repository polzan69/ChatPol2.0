const express = require('express');

const { signUp,
        login,
        getUsers,
} = require('../Controllers/userController');

const authMiddleware = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/uploadMiddleware');

const router = express.Router();

router.post('/signup', upload, signUp);
router.post('/login', login);
// router.get('/get', authMiddleware, getUsers); if with auth
router.get('/get',  getUsers);

module.exports = router;