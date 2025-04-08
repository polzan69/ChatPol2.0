const GroupChat = require('../Models/GroupChat');
const User = require('../Models/User');
const Message = require('../Models/Message');

// Create a new group chat
const createGroupChat = async (req, res) => {
    try {
        const { name, members } = req.body;
        const creator = req.user._id;

        if (!name || !members || !Array.isArray(members)) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        // Ensure creator is included in members
        const memberSet = new Set(members);
        memberSet.add(creator.toString());
        const uniqueMembers = Array.from(memberSet);

        const newGroupChat = new GroupChat({
            name,
            members: uniqueMembers,
            creator
        });

        await newGroupChat.save();

        // Populate the members and creator information
        const populatedGroup = await GroupChat.findById(newGroupChat._id)
            .populate('members', 'firstName lastName email profilePicture')
            .populate('creator', 'firstName lastName email profilePicture');

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error('Error creating group chat:', error);
        res.status(500).json({ message: 'Error creating group chat' });
    }
};

// Get all group chats for a user
const getUserGroupChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const groupChats = await GroupChat.find({ members: userId })
            .populate('members', 'firstName lastName email profilePicture')
            .populate('creator', 'firstName lastName email profilePicture')
            .populate('lastMessage');

        res.status(200).json(groupChats);
    } catch (error) {
        console.error('Error fetching user group chats:', error);
        res.status(500).json({ message: 'Error fetching group chats' });
    }
};

// Get a specific group chat
const getGroupChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const groupChat = await GroupChat.findById(id)
            .populate('members', 'firstName lastName email profilePicture')
            .populate('creator', 'firstName lastName email profilePicture');

        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found' });
        }

        // Check if the user is a member of the group
        if (!groupChat.members.some(member => member._id.toString() === userId.toString())) {
            return res.status(403).json({ message: 'Not authorized to access this group chat' });
        }

        // Get messages for this group chat
        const messages = await Message.find({ groupChat: id })
            .populate('sender', 'firstName lastName profilePicture')
            .sort({ timestamp: 1 });

        res.status(200).json({ groupChat, messages });
    } catch (error) {
        console.error('Error fetching group chat:', error);
        res.status(500).json({ message: 'Error fetching group chat' });
    }
};

// Update a group chat
const updateGroupChat = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, members } = req.body;
        const userId = req.user._id;

        const groupChat = await GroupChat.findById(id);

        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found' });
        }

        // Only the creator can update the group
        if (groupChat.creator.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this group chat' });
        }

        // Update the group chat
        const updatedGroupChat = await GroupChat.findByIdAndUpdate(
            id,
            { 
                name: name || groupChat.name,
                members: members || groupChat.members
            },
            { new: true }
        )
        .populate('members', 'firstName lastName email profilePicture')
        .populate('creator', 'firstName lastName email profilePicture');

        res.status(200).json(updatedGroupChat);
    } catch (error) {
        console.error('Error updating group chat:', error);
        res.status(500).json({ message: 'Error updating group chat' });
    }
};

module.exports = {
    createGroupChat,
    getUserGroupChats,
    getGroupChat,
    updateGroupChat
}; 