import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Dashboard = () => {
    const navigate = useNavigate();
    const userName = "Current User"; // Replace with actual user name
    const profilePicture = ""; // Replace with actual profile picture URL

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div>
            <Header userName={userName} profilePicture={profilePicture} />
            <h1>Dashboard</h1>
            <p>Welcome to your dashboard!</p>
        </div>
    );
};

export default Dashboard;