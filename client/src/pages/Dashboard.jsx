import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import './css/Dashboard.css';
import socket from '../socket'; // Import the centralized socket
import { useNavigate } from 'react-router-dom';
import ChatArea from '../components/ChatArea';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            setCurrentUser(userData);
        };

        fetchCurrentUser();

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/friends/list', {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                });
                const processedUsers = response.data.map(user => ({
                    ...user,
                    profilePicture: user.profilePicture 
                        ? `http://localhost:5000/${user.profilePicture}` 
                        : ''
                }));
                setUsers(processedUsers);
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchUsers();

        // Add event listener for friend list updates
        window.addEventListener('friendsListUpdate', fetchUsers);

        socket.on('userStatusUpdate', (data) => {
            setUsers((prevUsers) => 
                prevUsers.map((user) => 
                    user._id === data.userId ? { ...user, status: data.status } : user
                )
            );
            console.log(`User ${data.userId} status updated to ${data.status}`);
        });

        return () => {
            socket.off('userStatusUpdate');
            window.removeEventListener('friendsListUpdate', fetchUsers);
        };
    }, []);

    const handleUserClick = async (userId) => {
        setSelectedUser(userId);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/messages/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleUserUpdate = (updatedUser) => {
        setCurrentUser(updatedUser);
        setUsers(prevUsers => 
            prevUsers.map(user => 
                user._id === updatedUser._id 
                    ? {
                        ...user,
                        ...updatedUser,
                        profilePicture: updatedUser.profilePicture 
                            ? `http://localhost:5000/${updatedUser.profilePicture}` 
                            : ''
                    }
                    : user
            )
        );
    };

    return (
        <div className="dashboard">
            <Header 
                user={currentUser} 
                onUpdate={handleUserUpdate} 
            />
            <div className="dashboard-content">
                <div className={`user-list ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="user-list-header">
                        <button 
                            className="toggle-sidebar-btn"
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            {isSidebarCollapsed ? '→' : '←'}
                        </button>
                    </div>
                    {users.map(user => (
                        <div 
                            key={user._id} 
                            className={`user-item ${user.status ? user.status.toLowerCase() : 'offline'}`} 
                            onClick={() => handleUserClick(user._id)}
                        >
                            <div className={`status-indicator ${user.status === 'Online' ? 'online' : 'offline'}`}></div>
                            {user.profilePicture ? (
                                <img 
                                    src={user.profilePicture}
                                    alt={user.firstName} 
                                    className="user-profile-picture"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                            ) : (
                                <div className="user-profile-picture default-avatar">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </div>
                            )}
                            {!isSidebarCollapsed && (
                                <div className="user-info">
                                    <span className="user-name">{user.firstName} {user.lastName}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {currentUser && (
                    <ChatArea 
                        selectedUser={selectedUser} 
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;