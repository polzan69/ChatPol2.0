import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Header.css';

const Header = ({ userName, profilePicture }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-title">ChatPol</div>
            <div className="header-user">
                {profilePicture && <img src={profilePicture} alt="Profile" className="profile-picture" />}
                <span className="user-name">{userName}</span>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        </header>
    );
};

export default Header;