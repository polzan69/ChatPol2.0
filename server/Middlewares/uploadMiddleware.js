const multer = require('multer');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Filter for image files
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|jfif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
};

// Initialize multer for profile pictures
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: fileFilter
}).single('profilePicture');

// Wrapper function to handle ImgBB upload
const uploadToImgBB = async (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return next(err);
        }

        if (!req.file) {
            return next();
        }

        try {
            const formData = new FormData();
            formData.append('image', req.file.buffer.toString('base64'));
            formData.append('key', '2fd6dd451112e14b78d9795bed49504d');

            const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
                headers: formData.getHeaders()
            });

            // Store the ImgBB URL in the request object
            req.file.path = response.data.data.url;
            next();
        } catch (error) {
            next(error);
        }
    });
};

module.exports = uploadToImgBB;