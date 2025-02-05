import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Header.css';

const Header = ({ userName, profilePicture }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const token = localStorage.getItem('token');

        if (currentUser && token) {
            try {
                // Call the logout endpoint
                await axios.post(`http://localhost:5000/api/users/logout/${currentUser._id}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
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
        </header>
    );
};

export default Header;