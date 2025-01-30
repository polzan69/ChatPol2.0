const { get } = require('mongoose');
const User = require('../Models/User');
const jwt = require('jsonwebtoken'); 
const sharp = require('sharp');
const fs = require('fs');

// Sign up function
const signUp = async (req, res) => {
    const { firstName, lastName, age, email, password } = req.body;
    let profilePicturePath = req.file ? req.file.path : null;

    try {
        if (profilePicturePath) {
            const resizedImagePath = `uploads/resized-${req.file.filename}`;
            await sharp(profilePicturePath)
                .resize(250, 250)
                .toFile(resizedImagePath);

            fs.unlinkSync(profilePicturePath);
            profilePicturePath = resizedImagePath;
        }

        const newUser = new User({ firstName, lastName, age, email, password, profilePicture: profilePicturePath });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login function
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Get existing users
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'email');
        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching emails: ', error);
        return res.status(500).json({ error: 'An error occurred while fetching emails' });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    signUp, 
    login,
    getUsers,
    getUserById
};