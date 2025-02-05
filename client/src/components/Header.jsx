import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Header.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    withCredentials: true
});

const Header = ({ userName, profilePicture}) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
            setIsLoggingOut(true);
            try {
                await axios.post(`http://localhost:5000/api/users/logout/${currentUser._id}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                socket.emit('userLogout', currentUser._id);
            } catch (error) {
                console.error('Error logging out user:', error);
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');

        setTimeout(() => {
            navigate('/');
        }, 2000);
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
                <button 
                    className="logout-button" 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </header>
    );
};

export default Header;