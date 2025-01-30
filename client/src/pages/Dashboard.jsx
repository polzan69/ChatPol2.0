import React from 'react';
// import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Dashboard = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    return (
        <div>
            <Header userName={currentUser ? currentUser.firstName : "Guest"} profilePicture={currentUser ? currentUser.profilePicture : ""} />
            <h1>Dashboard</h1>
            <p>Welcome to your dashboard!</p>
        </div>
    );
};

export default Dashboard;