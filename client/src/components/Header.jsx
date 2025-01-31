import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Header.css';

const Header = ({ userName, profilePicture }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            await axios.put(`http://localhost:5000/api/users/updateStatus/${currentUser._id}`, { status: 'Offline' }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
        }
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser'); // Clear current user on logout
        navigate('/');
    };

    // Debugging line to check the profile picture URL
    console.log('Profile Picture URL:', profilePicture);

    // Assuming your server is running on localhost:5000
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