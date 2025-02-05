import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import './css/Dashboard.css';
import socket from '../socket'; // Import the centralized socket
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Redirect to login if currentUser is null
    useEffect(() => {
        if (!currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/users/get');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();

        socket.on('userStatusUpdate', (data) => {
            setUsers((prevUsers) => 
                prevUsers.map((user) => 
                    user._id === data.userId ? { ...user, status: data.status } : user
                )
            );
            console.log(`User ${data.userId} status updated to ${data.status}`);
        });

        return () => {
            // Do not disconnect the socket here
        };
    }, []);

    const handleUserClick = async (userId) => {
        setSelectedUser(userId);
        try {
            const response = await axios.get(`http://localhost:5000/api/messages/${userId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    return (
        <div className="dashboard">
            {currentUser && (
                <Header userName={currentUser.firstName} profilePicture={currentUser.profilePicture} />
            )}
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