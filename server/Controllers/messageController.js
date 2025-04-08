const Message = require('../Models/Message');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const GroupChat = require('../Models/GroupChat');

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
        .populate('sender', 'firstName lastName profilePicture')
        .populate('receiver', 'firstName lastName profilePicture')
        .populate('groupChat');

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const uploadImage = async (imageFile) => {
    try {
        console.log('Starting image upload process...');
        console.log('Image file details:', {
            filename: imageFile.filename,
            path: imageFile.path,
            mimetype: imageFile.mimetype,
            size: imageFile.size
        });

        const formData = new FormData();
        formData.append('image', fs.createReadStream(imageFile.path));
        
        console.log('Sending request to ImgBB API...');
        console.log('Using API key:', process.env.IMGBB_API_KEY);

        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            params: {
                key: process.env.IMGBB_API_KEY
            },
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('ImgBB API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
        });

        // Clean up the temporary file
        fs.unlink(imageFile.path, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
            else console.log('Temporary file deleted successfully');
        });

        return response.data.data.url;
    } catch (error) {
        console.error('Error uploading image to ImgBB:', error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
        } : error.message);
        throw error;
    }
};

const sendMessage = async (req, res) => {
    try {
        console.log('Received message request:', {
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file attached'
        });

        const { receiverId, groupId, content } = req.body;
        const senderId = req.user._id;
        let imageUrl = null;
        let messageType = 'text';

        // Handle image upload if present
        if (req.file) {
            console.log('Processing image upload...');
            imageUrl = await uploadImage(req.file);
            messageType = 'image';
            console.log('Image uploaded successfully, URL:', imageUrl);
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId || null,
            groupChat: groupId || null,
            content: content || null,
            imageUrl: imageUrl,
            messageType: messageType
        });

        console.log('Saving new message:', {
            messageType,
            hasContent: !!content,
            hasImage: !!imageUrl,
            isGroupMessage: !!groupId
        });

        await newMessage.save();

        // If this is a group message, update the group's lastMessage
        if (groupId) {
            await GroupChat.findByIdAndUpdate(groupId, {
                lastMessage: newMessage._id
            });
        }

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'firstName lastName profilePicture')
            .populate('receiver', 'firstName lastName profilePicture')
            .populate('groupChat');

        console.log('Message saved successfully:', {
            messageId: populatedMessage._id,
            type: populatedMessage.messageType,
            isGroupMessage: !!populatedMessage.groupChat
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage
};