import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import './css/Dashboard.css';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';
import ChatArea from '../components/ChatArea';

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);
    const [isSwipeActive, setIsSwipeActive] = useState(false);
    
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const minSwipeDistance = 50; // Minimum distance for swipe to register
    const swipeZoneWidth = 30; // Width of area from left edge that activates swipe
    
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 576;
            setIsMobile(newIsMobile);
            if (!newIsMobile) {
                setShowSidebarMobile(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                setUsers(response.data);
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

    const toggleSidebar = () => {
        setShowSidebarMobile(!showSidebarMobile);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        
        // Check if touch started near the left edge
        if (touchStartX.current <= swipeZoneWidth) {
            setIsSwipeActive(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isSwipeActive) return;
        
        touchEndX.current = e.touches[0].clientX;
        
        // If swiping right and sidebar is closed, prevent default to avoid page scrolling
        if (touchEndX.current > touchStartX.current && !showSidebarMobile) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (!isSwipeActive) return;
        
        setIsSwipeActive(false);
        
        // Calculate swipe distance
        const swipeDistance = touchEndX.current - touchStartX.current;
        
        // If swiped right with enough distance and sidebar is closed
        if (swipeDistance > minSwipeDistance && !showSidebarMobile) {
            setShowSidebarMobile(true);
        }
        
        // If swiped left with enough distance and sidebar is open
        else if (swipeDistance < -minSwipeDistance && showSidebarMobile) {
            setShowSidebarMobile(false);
        }
        
        // Reset touch positions
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    const handleUserClick = async (userId) => {
        setSelectedUser(userId);
        if (isMobile) {
            setShowSidebarMobile(false); // Close sidebar after selection on mobile
        }
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

    useEffect(() => {
        // Add touch event listeners to the document for mobile swipe
        if (isMobile) {
            document.addEventListener('touchstart', handleTouchStart, { passive: false });
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            
            return () => {
                document.removeEventListener('touchstart', handleTouchStart);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [isMobile, isSwipeActive, showSidebarMobile]);

    return (
        <div className="dashboard">
            <Header 
                user={currentUser} 
                onUpdate={handleUserUpdate} 
            />
            
            {/* Swipe indicator for mobile */}
            {isMobile && !showSidebarMobile && (
                <div className={`swipe-indicator ${isSwipeActive ? 'active' : ''}`} />
            )}
            
            {/* Overlay for closing sidebar */}
            {isMobile && (
                <div 
                    className={`sidebar-overlay ${showSidebarMobile ? 'visible' : ''}`}
                    onClick={toggleSidebar}
                />
            )}
            
            <div className="dashboard-content">
                <div className={`user-list ${isSidebarCollapsed ? 'collapsed' : ''} ${showSidebarMobile ? 'visible' : ''}`}>
                    <div className="user-list-header">
                        {!isMobile ? (
                            <button 
                                className="toggle-sidebar-btn"
                                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                            >
                                {isSidebarCollapsed ? '→' : '←'}
                            </button>
                        ) : (
                            <>
                                <div className="user-list-title">Friends</div>
                                <button 
                                    className="close-sidebar-btn"
                                    onClick={toggleSidebar}
                                    aria-label="Close sidebar"
                                >
                                    ×
                                </button>
                            </>
                        )}
                    </div>
                    
                    {/* User list */}
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