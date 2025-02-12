const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (!token) {
            return res.status(403).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the user and attach to request
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach the full user object to the request
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authMiddleware;