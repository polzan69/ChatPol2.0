import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileEditModal from './ProfileEditModal';
import './css/Header.css';
import socket from '../socket'; // Import the centralized socket

const Header = ({ user, onUpdate }) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        return () => {
            // Do not disconnect the socket here
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

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleUpdate = (updatedUser) => {
        onUpdate(updatedUser);
    };

    if (!user) {
        return null;
    }

    return (
        <header className="header">
            <div className="header-title">ChatPol</div>
            <div className="header-user">
                <img 
                    src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : ''} 
                    alt="Profile" 
                    className="profile-picture" 
                    onClick={handleOpenModal}
                />
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <button 
                    className="logout-button" 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
            <ProfileEditModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                user={user} 
                onUpdate={handleUpdate} 
            />
        </header>
    );
};

export default Header;