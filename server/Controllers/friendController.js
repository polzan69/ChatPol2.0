const FriendRequest = require('../Models/FriendRequest');
const User = require('../Models/User');

// Search users
const searchUsers = async (req, res) => {
    const { query } = req.query;
    try {
        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: 'i' } },
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        }).select('firstName lastName email profilePicture');
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Send friend request
const sendFriendRequest = async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    try {
        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already exists' });
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId
        });

        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Handle friend request
const handleFriendRequest = async (req, res) => {
    const { requestId, status } = req.body;

    try {
        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Add users to each other's friends lists
            await User.findByIdAndUpdate(request.sender, {
                $addToSet: { friends: request.receiver }
            });
            await User.findByIdAndUpdate(request.receiver, {
                $addToSet: { friends: request.sender }
            });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get friend requests
const getFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'pending'
        }).populate('sender', 'firstName lastName email profilePicture');
        
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get friends list
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'firstName lastName email profilePicture status');
        res.status(200).json(user.friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchUsers,
    sendFriendRequest,
    handleFriendRequest,
    getFriendRequests,
    getFriends
};