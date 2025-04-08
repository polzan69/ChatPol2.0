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
    const minSwipeDistance = 50;
    const swipeZoneWidth = 30;
    const isMouseDown = useRef(false);
    
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
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        touchStartX.current = clientX;
        
        if (clientX <= swipeZoneWidth) {
            setIsSwipeActive(true);
            if (e.type === 'mousedown') {
                isMouseDown.current = true;
            }
            // Prevent text selection
            e.preventDefault();
            document.body.style.userSelect = 'none';
        }
    };

    const handleTouchMove = (e) => {
        if (!isSwipeActive) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        touchEndX.current = clientX;
        
        if (touchEndX.current > touchStartX.current && !showSidebarMobile) {
            e.preventDefault();
        }
        // Prevent text selection during swipe
        e.preventDefault();
    };

    const handleTouchEnd = (e) => {
        if (!isSwipeActive) return;
        
        if (e.type === 'mouseup') {
            isMouseDown.current = false;
        }
        
        setIsSwipeActive(false);
        
        const swipeDistance = touchEndX.current - touchStartX.current;
        
        if (swipeDistance > minSwipeDistance && !showSidebarMobile) {
            setShowSidebarMobile(true);
        } else if (swipeDistance < -minSwipeDistance && showSidebarMobile) {
            setShowSidebarMobile(false);
        }
        
        touchStartX.current = 0;
        touchEndX.current = 0;
        // Re-enable text selection
        document.body.style.userSelect = '';
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
        // Add both touch and mouse event listeners
        const addEventListeners = () => {
            // Touch events
            document.addEventListener('touchstart', handleTouchStart, { passive: false });
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            
            // Mouse events
            document.addEventListener('mousedown', handleTouchStart);
            document.addEventListener('mousemove', (e) => {
                if (isMouseDown.current) {
                    handleTouchMove(e);
                }
            });
            document.addEventListener('mouseup', handleTouchEnd);
        };

        const removeEventListeners = () => {
            // Touch events
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            
            // Mouse events
            document.removeEventListener('mousedown', handleTouchStart);
            document.removeEventListener('mousemove', handleTouchMove);
            document.removeEventListener('mouseup', handleTouchEnd);
        };

        if (window.innerWidth <= 576) {
            addEventListeners();
        }

        return removeEventListeners;
    }, [isSwipeActive, showSidebarMobile]);

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
                            // <button 
                            //     className="toggle-sidebar-btn"
                            //     onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                            // >
                            //     {isSidebarCollapsed ? '→' : '←'}
                            // </button>
                            <div className="user-list-title" style={{fontSize: '18px !important', fontWeight: 'bold !important', color: '#4185b3 !important'}}>Friends</div>
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