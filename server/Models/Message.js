const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    groupChat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupChat',
        required: false,
    },
    content: {
        type: String,
        required: function() {
            return !this.imageUrl; // Content is required if there's no imageUrl
        },
    },
    imageUrl: {
        type: String,
        required: function() {
            return !this.content; // imageUrl is required if there's no content
        },
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    read: {
        type: Boolean,
        default: false,
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;