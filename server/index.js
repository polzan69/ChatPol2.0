const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const GroupChat = require('./Models/GroupChat');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Created uploads directory');
}

const User = require('./Models/User');
const Message = require('./Models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
}); 

const userRoutes = require('./Routes/UserRoutes');
const friendRoutes = require('./Routes/FriendRoutes');
const messageRoutes = require('./Routes/MessageRoutes');
const groupRoutes = require('./Routes/groupRoutes');

const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', async (userId) => {
        try {
            // Join user's personal room
            socket.join(userId.toString());
            console.log(`User ${userId} joined personal room ${userId}`);

            // Join all group chat rooms the user is a member of
            const userGroups = await GroupChat.find({ members: userId });
            for (const group of userGroups) {
                const roomId = `group:${group._id}`;
                socket.join(roomId);
                console.log(`User ${userId} joined group room: ${roomId}`);
            }
        } catch (error) {
            console.error('Error joining rooms:', error);
        }
    });

    socket.on('registerUser', async (userId) => {
        try {
            const user = await User.findByIdAndUpdate(
                userId, 
                { socketId: socket.id, status: 'Online' }, 
                { new: true }
            );
            if (user) {
                socket.join(userId.toString());
                io.emit('userStatusUpdate', { userId, status: 'Online' });
            }
        } catch (error) {
            console.error('Error registering user:', error);
        }
    });

    socket.on('sendMessage', async (data) => {
        try {
            console.log('Broadcasting message:', data);
            
            if (data.groupChat) {
                // For group messages, broadcast to the group room
                const roomId = `group:${data.groupChat._id}`;
                console.log(`Broadcasting group message to room: ${roomId}`);
                
                // Update the group's lastMessage
                await GroupChat.findByIdAndUpdate(data.groupChat._id, {
                    lastMessage: data._id
                });

                // Broadcast to all members in the group
                io.to(roomId).emit('newMessage', {
                    ...data,
                    timestamp: new Date()
                });
            } else if (data.receiver) {
                // For direct messages, broadcast to both sender and receiver rooms
                console.log('Broadcasting direct message to:', data.sender._id, data.receiver._id);
                io.to(data.receiver._id.toString())
                  .to(data.sender._id.toString())
                  .emit('newMessage', {
                      ...data,
                      timestamp: new Date()
                  });
            }
        } catch (error) {
            console.error('Error handling socket message:', error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            console.log('Client disconnected:', socket.id);
            
            const user = await User.findOne({ socketId: socket.id });
            if (user) {
                await User.findByIdAndUpdate(user._id, { 
                    status: 'Offline',
                    socketId: null
                });
                io.emit('userStatusUpdate', { 
                    userId: user._id, 
                    status: 'Offline' 
                });
                console.log(`User ${user.firstName} is now Offline`);
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

