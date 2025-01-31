const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server); 
const userRoutes = require('./Routes/UserRoutes');

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/uploads', express.static('uploads')); 

// WebSocket connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Listen for incoming messages
    socket.on('sendMessage', async (data) => {
        const { sender, receiver, content } = data;

        // Save the message to the database
        const message = new Message({ sender, receiver, content });
        await message.save();

        // Emit the message to the receiver
        socket.to(receiver).emit('receiveMessage', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Routes
app.use('/api/users', userRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
