const Message = require('../Models/Message');

const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('sender', 'firstName lastName')
        .populate('receiver', 'firstName lastName');

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });

        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'firstName lastName profilePicture')
            .populate('receiver', 'firstName lastName profilePicture');

        // Emit to both sender and receiver
        if (req.io) {
            req.io.to(receiverId.toString()).emit('newMessage', populatedMessage);
            req.io.to(senderId.toString()).emit('newMessage', populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage
};