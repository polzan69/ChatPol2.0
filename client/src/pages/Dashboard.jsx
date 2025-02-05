import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import './css/Dashboard.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
    transports: ['websocket'], // Use WebSocket transport
    withCredentials: true // Include credentials
});

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        // Fetch registered users
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/users/get');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();

        // Listen for user status updates
        socket.on('userStatusUpdate', (data) => {
            setUsers((prevUsers) => 
                prevUsers.map((user) => 
                    user._id === data.userId ? { ...user, status: data.status } : user
                )
            );
            console.log(`User ${data.userId} status updated to ${data.status}`);
        });

        return () => {
            socket.off('userStatusUpdate'); // Clean up the listener on component unmount
        };
    }, []);

    const handleUserClick = async (userId) => {
        setSelectedUser(userId);
        // Fetch messages for the selected user
        try {
            const response = await axios.get(`http://localhost:5000/api/messages/${userId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    return (
        <div className="dashboard">
            <Header userName={currentUser.firstName} profilePicture={currentUser.profilePicture} />
            <div className="dashboard-content">
                <div className="user-list">
                    <h2>Users</h2>
                    {users.map(user => (
                        <div 
                            key={user._id} 
                            className={`user-item ${user.status ? user.status.toLowerCase() : 'offline'}`} 
                            onClick={() => handleUserClick(user._id)}
                        >
                            <div className={`status-indicator ${user.status === 'Online' ? 'online' : 'offline'}`}></div>
                            <img src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : ''} alt={user.firstName} className="user-profile-picture" />
                            <span>{user.firstName} {user.lastName} ({user.email})</span>
                        </div>
                    ))}
                </div>
                <div className="chat-area">
                    <h2>Chat</h2>
                    {selectedUser ? (
                        messages.length > 0 ? (
                            messages.map(message => (
                                <div key={message._id} className="message">
                                    <strong>{message.sender}</strong>: {message.content}
                                </div>
                            ))
                        ) : (
                            <p>No messages</p>
                        )
                    ) : (
                        <p>Select a user to start chatting</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;