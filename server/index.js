const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const User = require('./Models/User');
const app = express();
const server = http.createServer(app);
const io = socketIo(server); 
const userRoutes = require('./Routes/UserRoutes');
const friendRoutes = require('./Routes/FriendRoutes');

const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from your frontend
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/uploads', express.static('uploads')); 

//Test WebSocket connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('registerUser', async (userId) => {
        const user = await User.findByIdAndUpdate(userId, { socketId: socket.id, status: 'Online' }, { new: true });
        console.log(`User ${userId} is now Online`, user);
        
        // Emit an event to all clients to update the user status
        io.emit('userStatusUpdate', { userId, status: 'Online' });
    });

    socket.on('userLogout', async (userId) => {
        // Update user status to Offline in the database
        await User.findByIdAndUpdate(userId, { status: 'Offline' });

        // Emit an event to all clients to update the user status
        io.emit('userStatusUpdate', { userId, status: 'Offline' });
        console.log(`User ${userId} has logged out`);
    });

    // Listen for incoming messages
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, content } = data;

        // Save the message to the database
        const message = new Message({ sender, receiver, content });
        await message.save();

        // Emit the message to the receiver
        socket.to(receiver).emit('receiveMessage', message);
    });

    socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        
        // Check if the user is still logged in
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
            console.log(`User ${user.firstName} is now Offline`);
        }
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

