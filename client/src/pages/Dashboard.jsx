import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import './css/Dashboard.css';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    useEffect(() => {
        // Fetch registered users
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/users/get'); // Adjust the URL if needed
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
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
                            <img src={user.profilePicture} alt={user.firstName} className="user-profile-picture" />
                            <span>{user.firstName} {user.lastName} ({user.email}) - {user.status}</span> {/* Display name and email */}
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
                            <p>No messages yet.</p>
                        )
                    ) : (
                        <p>Select a user to see messages.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;