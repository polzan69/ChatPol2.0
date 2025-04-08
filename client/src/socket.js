import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    timeout: 10000,
});

// Connection event handlers
socket.on('connect', () => {
    console.log('Connected to socket server');
    
    // Retrieve user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user._id) {
        // Register user and join their rooms
        socket.emit('registerUser', user._id);
        socket.emit('joinRoom', user._id);
    }
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected to socket server after', attemptNumber, 'attempts');
    
    // Re-register user and join rooms after reconnection
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user._id) {
        socket.emit('registerUser', user._id);
        socket.emit('joinRoom', user._id);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
});

// Helper functions for socket events
const joinGroupChat = (groupId) => {
    if (!socket.connected) {
        console.warn('Socket not connected. Cannot join group chat.');
        return;
    }
    socket.emit('joinRoom', `group:${groupId}`);
};

const sendMessage = (messageData) => {
    if (!socket.connected) {
        console.warn('Socket not connected. Cannot send message.');
        return false;
    }
    socket.emit('sendMessage', messageData);
    return true;
};

const subscribeToMessages = (callback) => {
    socket.on('newMessage', callback);
};

const subscribeToUserStatus = (callback) => {
    socket.on('userStatusUpdate', callback);
};

const unsubscribeFromMessages = (callback) => {
    socket.off('newMessage', callback);
};

const unsubscribeFromUserStatus = (callback) => {
    socket.off('userStatusUpdate', callback);
};

export {
    socket as default,
    joinGroupChat,
    sendMessage,
    subscribeToMessages,
    subscribeToUserStatus,
    unsubscribeFromMessages,
    unsubscribeFromUserStatus,
};
