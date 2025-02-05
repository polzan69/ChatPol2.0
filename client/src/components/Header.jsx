import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Header.css';
import './css/MessageBox.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
    transports: ['websocket'], // Use WebSocket transport
    withCredentials: true // Include credentials
});

const Header = ({ userName, profilePicture }) => {
    const navigate = useNavigate();
    const [logoutMessage, setLogoutMessage] = useState('');

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleLogout = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const token = localStorage.getItem('token');

        if (currentUser && token) {
            try {
                // Display logout message
                setLogoutMessage('Logging out...');

                // Call the logout endpoint
                await axios.post(`http://localhost:5000/api/users/logout/${currentUser._id}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Emit the logout event
                socket.emit('userLogout', currentUser._id);

                // Debugging log to check if the user is considered logged out
                console.log(`User ${currentUser._id} has logged out and emitted userLogout event.`);
            } catch (error) {
                console.error('Error logging out user:', error);
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        navigate('/');
    };

    console.log('Profile Picture URL:', profilePicture);

    //this works
    const profilePictureUrl = profilePicture ? `http://localhost:5000/${profilePicture}` : '';

    return (
        <header className="header">
            <div className="header-title">ChatPol</div>
            <div className="header-user">
                {profilePictureUrl && <img src={profilePictureUrl} alt="Profile" className="profile-picture" />}
                <span className="user-name">{userName}</span>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
            {logoutMessage && (
                <div className={`message-box logout fade-in`}>
                    {logoutMessage}
                </div>
            )}
        </header>
    );
};

export default Header;