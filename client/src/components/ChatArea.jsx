import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './css/ChatArea.css';
import socket from '../socket';
import ImageModal from './ImageModal';

const ChatArea = ({ selectedUser, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const messagesEndRef = useRef(null);
    const [selectedUserData, setSelectedUserData] = useState(null);
    const [groupData, setGroupData] = useState(null);
    const [showTimestamp, setShowTimestamp] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
    const fileInputRef = useRef(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedUser && currentUser?._id) {
            fetchMessages();
            
            // Join user's room and group rooms
            socket.emit('joinRoom', currentUser._id);
            
            // Listen for new messages
            const handleNewMessage = (message) => {
                console.log('Received message:', message);
                const isGroupChat = selectedUser.startsWith('group:');
                const groupId = isGroupChat ? selectedUser.replace('group:', '') : null;
                
                if (
                    // For direct messages
                    (!isGroupChat && message.receiver && (
                        (message.sender._id === selectedUser && message.receiver._id === currentUser._id) ||
                        (message.sender._id === currentUser._id && message.receiver._id === selectedUser)
                    )) ||
                    // For group messages
                    (isGroupChat && message.groupChat && message.groupChat._id === groupId)
                ) {
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                }
            };

            socket.on('newMessage', handleNewMessage);

            return () => {
                socket.off('newMessage', handleNewMessage);
            };
        }
    }, [selectedUser, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (selectedUser) {
            const isGroupChat = selectedUser.startsWith('group:');
            if (isGroupChat) {
                fetchGroupData();
            } else {
                fetchSelectedUserData();
            }
        }
    }, [selectedUser]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 576);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchGroupData = async () => {
        try {
            const token = localStorage.getItem('token');
            const groupId = selectedUser.replace('group:', '');
            const response = await axios.get(
                `http://localhost:5000/api/groups/${groupId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setGroupData(response.data.groupChat);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Error fetching group data:', error);
        }
    };

    const fetchSelectedUserData = async () => {
        try {
            if (selectedUser.startsWith('group:')) return; // Skip if it's a group chat
            
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/users/get/${selectedUser}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSelectedUserData(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchMessages = async () => {
        if (selectedUser.startsWith('group:')) {
            await fetchGroupData();
        } else {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://localhost:5000/api/messages/${selectedUser}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            // Check if this is a group chat or direct message
            if (selectedUser.startsWith('group:')) {
                const groupId = selectedUser.replace('group:', '');
                formData.append('groupId', groupId);
            } else {
                formData.append('receiverId', selectedUser);
            }
            
            if (newMessage.trim()) {
                formData.append('content', newMessage.trim());
            }
            
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            console.log('Sending message request to server...');
            const response = await axios.post(
                'http://localhost:5000/api/messages/send',
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Server response:', response.data);
            socket.emit('sendMessage', response.data);
            setNewMessage('');
            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log('Image selected:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
            setSelectedImage(file);
        }
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImageUrl(imageUrl);
        setIsImageModalOpen(true);
    };

    const handleMessageClick = (messageId) => {
        setShowTimestamp(showTimestamp === messageId ? null : messageId);
    };

    const renderMessageSender = (message) => {
        const isSentByCurrentUser = message.sender._id === currentUser._id;
        if (selectedUser.startsWith('group:')) {
            return isSentByCurrentUser ? 'You' : `${message.sender.firstName} ${message.sender.lastName}`;
        }
        return null;
    };

    if (!selectedUser) {
        return (
            <div className="chat-area empty-chat">
                <div className="empty-chat-message">
                    Select a user or group to start chatting
                </div>
            </div>
        );
    }

    return (
        <div className="chat-area">
            {selectedUser.startsWith('group:') && groupData && (
                <div className="chat-header">
                    <h3>{groupData.name}</h3>
                    <span className="group-members">
                        {groupData.members.length} members
                    </span>
                </div>
            )}
            <div className="chat-messages">
                {messages.map((message) => {
                    const isSentByCurrentUser = message.sender._id === currentUser._id;
                    const senderName = renderMessageSender(message);
                    const userProfilePic = isSentByCurrentUser 
                        ? currentUser.profilePicture 
                        : message.sender.profilePicture;

                    return (
                        <div
                            key={message._id}
                            className={`message-container ${isSentByCurrentUser ? 'sent' : 'received'}`}
                        >
                            {!isMobile && !isSentByCurrentUser && (
                                <div className="message-avatar">
                                    {userProfilePic ? (
                                        <img 
                                            src={userProfilePic}
                                            alt={`${message.sender.firstName}'s avatar`}
                                        />
                                    ) : (
                                        <div className="default-avatar">
                                            {message.sender.firstName?.charAt(0)}
                                            {message.sender.lastName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div 
                                className={`message ${isSentByCurrentUser ? 'sent' : 'received'} ${showTimestamp === message._id ? 'show-timestamp' : ''}`}
                                onClick={() => handleMessageClick(message._id)}
                            >
                                {senderName && (
                                    <div className="message-sender">{senderName}</div>
                                )}
                                <div className="message-content">
                                    {message.messageType === 'image' ? (
                                        <img 
                                            src={message.imageUrl} 
                                            alt="Shared image" 
                                            className="message-image"
                                            onClick={() => handleImageClick(message.imageUrl)}
                                        />
                                    ) : (
                                        message.content
                                    )}
                                </div>
                                <div className="message-timestamp">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            {!isMobile && isSentByCurrentUser && (
                                <div className="message-avatar">
                                    {userProfilePic ? (
                                        <img 
                                            src={userProfilePic}
                                            alt="Your avatar"
                                        />
                                    ) : (
                                        <div className="default-avatar">
                                            {currentUser.firstName?.charAt(0)}
                                            {currentUser.lastName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />
                <button 
                    type="button" 
                    className="image-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                >
                    📷
                </button>
                <button type="submit" className="send-button">
                    Send
                </button>
            </form>
            <ImageModal 
                isOpen={isImageModalOpen}
                imageUrl={selectedImageUrl}
                onClose={() => setIsImageModalOpen(false)}
            />
        </div>
    );
};

export default ChatArea;