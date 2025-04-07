const express = require('express');
const router = express.Router();
const auth = require('../Middlewares/authMiddleware');
const { getMessages, sendMessage } = require('../Controllers/messageController');
const multer = require('multer');

// Configure multer for temporary file storage
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.get('/:userId', auth, getMessages);
router.post('/send', auth, upload.single('image'), sendMessage);

module.exports = router;