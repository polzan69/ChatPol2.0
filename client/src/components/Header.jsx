import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileEditModal from './ProfileEditModal';
import './css/Header.css';
import socket from '../socket'; // Import the centralized socket
import UserSearchDropdown from './UserSearchDropdown';
import FriendRequestsModal from './FriendRequestsModal';

const Header = ({ user, onUpdate }) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [newRequestsCount, setNewRequestsCount] = useState(0);

    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        const fetchFriendRequests = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/friends/requests', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setFriendRequests(response.data);
                setNewRequestsCount(response.data.length);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        };

        fetchFriendRequests();
        const interval = setInterval(fetchFriendRequests, 30000); // Check every 30 seconds

        return () => {
            // Do not disconnect the socket here
            clearInterval(interval);
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

    const handleUpdate = (updatedUser) => {
        // Ensure we're working with the complete user object
        const completeUpdatedUser = {
            ...user,
            ...updatedUser,
            profilePicture: updatedUser.profilePicture
        };
        
        // Update the parent component
        onUpdate(completeUpdatedUser);
        
        // Update local storage
        localStorage.setItem('currentUser', JSON.stringify(completeUpdatedUser));
    };

    const handleSearch = async (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length >= 2) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No token found');
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/friends/search?query=${e.target.value}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('Search results:', response.data);
                setSearchResults(response.data);
                setShowDropdown(true);
            } catch (error) {
                if (error.response?.status === 401) {
                    console.error('Authentication error:', error.response.data);
                    // Handle unauthorized error (e.g., redirect to login)
                } else {
                    console.error('Error searching users:', error.response?.data || error.message);
                }
                setShowDropdown(false);
            }
        } else {
            setShowDropdown(false);
        }
    };

    const handleSendRequest = async (receiverId) => {
        try {
            await axios.post('http://localhost:5000/api/friends/request', 
                { receiverId },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
            );
            setShowDropdown(false);
            setSearchQuery('');
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleRequestResponse = async (requestId, status) => {
        try {
            await axios.put('http://localhost:5000/api/friends/request/handle',
                { requestId, status },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
            );
            setFriendRequests(prev => prev.filter(req => req._id !== requestId));
            setNewRequestsCount(prev => prev - 1);
        } catch (error) {
            console.error('Error handling friend request:', error);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <header className="header">
            <div className="header-title">ChatPol</div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-input"
                />
                {showDropdown && (
                    <UserSearchDropdown
                        users={searchResults}
                        onSendRequest={handleSendRequest}
                        onClose={() => setShowDropdown(false)}
                    />
                )}
            </div>
            <div className="header-user">
                <div className="notifications">
                    <button 
                        className="notifications-btn"
                        onClick={() => setShowRequests(true)}
                    >
                        {newRequestsCount > 0 && (
                            <span className="notification-badge">{newRequestsCount}</span>
                        )}
                        🔔
                    </button>
                </div>
                <img 
                    src={user?.profilePicture ? `http://localhost:5000/${user.profilePicture}` : ''} 
                    alt="Profile" 
                    className="profile-picture" 
                    onClick={() => setIsModalOpen(true)}
                />
                <span className="userName" style={{ color: 'white' }}>{user?.firstName} {user?.lastName}</span>
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
                onClose={() => setIsModalOpen(false)} 
                user={user} 
                onUpdate={handleUpdate} 
            />
            <FriendRequestsModal
                isOpen={showRequests}
                onClose={() => setShowRequests(false)}
                requests={friendRequests}
                onAccept={(id) => handleRequestResponse(id, 'accepted')}
                onReject={(id) => handleRequestResponse(id, 'rejected')}
            />
        </header>
    );
};

export default Header;