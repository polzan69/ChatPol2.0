import React, { useEffect, useState, useRef } from 'react';
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
    const [userFriends, setUserFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const searchContainerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

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

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/friends/list', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setUserFriends(response.data);
            } catch (error) {
                console.error('Error fetching friends list:', error);
            }
        };

        fetchFriends();
        
        // Listen for friend list updates
        window.addEventListener('friendsListUpdate', fetchFriends);
        
        return () => {
            window.removeEventListener('friendsListUpdate', fetchFriends);
        };
    }, []);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                // Get sent requests that are pending
                const response = await axios.get('http://localhost:5000/api/friends/sent-requests', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setPendingRequests(response.data);
            } catch (error) {
                console.error('Error fetching pending requests:', error);
            }
        };

        fetchPendingRequests();
        const interval = setInterval(fetchPendingRequests, 30000);
        
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowDropdown(false);
                setSearchQuery('');
            }
        }
        
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 576);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            
            // Update requests list
            setFriendRequests(prev => prev.filter(req => req._id !== requestId));
            setNewRequestsCount(prev => prev - 1);
            
            // Trigger friend list refresh in Dashboard
            if (status === 'accepted') {
                window.dispatchEvent(new CustomEvent('friendsListUpdate'));
            }
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
            
            <div className="search-container" ref={searchContainerRef}>
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
                        currentUserFriends={userFriends}
                        pendingRequests={pendingRequests}
                    />
                )}
            </div>
            
            <div className="header-user">
                {!isMobile && <div className="notifications">
                    <button className="notifications-btn" onClick={() => setShowRequests(true)}>
                        🔔
                        {newRequestsCount > 0 && (
                            <span className="notification-badge">{newRequestsCount}</span>
                        )}
                    </button>
                </div>}
                
                {user?.profilePicture ? (
                    <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="profile-picture"
                        onClick={() => setIsModalOpen(true)}
                    />
                ) : (
                    <div 
                        className="profile-picture" 
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                )}
                
                {!isMobile && <span className="userName">{user?.firstName} {user?.lastName}</span>}
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>

            {isMobile && <div className="notifications mobile-notifications">
                <button className="notifications-btn" onClick={() => setShowRequests(true)}>
                    🔔
                    {newRequestsCount > 0 && (
                        <span className="notification-badge">{newRequestsCount}</span>
                    )}
                </button>
            </div>}
            
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