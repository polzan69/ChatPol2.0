import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './css/ChatArea.css';
import socket from '../socket';

const ChatArea = ({ selectedUser, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedUser && currentUser?._id) {
            fetchMessages();
            
            // Join user's room
            socket.emit('joinRoom', currentUser._id);
            
            // Listen for new messages
            const handleNewMessage = (message) => {
                console.log('Received message:', message);
                if (
                    (message.sender._id === selectedUser && message.receiver._id === currentUser._id) ||
                    (message.sender._id === currentUser._id && message.receiver._id === selectedUser)
                ) {
                    setMessages(prev => [...prev, message]);
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

    const fetchMessages = async () => {
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
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/messages/send',
                {
                    receiverId: selectedUser,
                    content: newMessage.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            socket.emit('sendMessage', response.data);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!selectedUser) {
        return (
            <div className="chat-area empty-chat">
                <div className="empty-chat-message">
                    Select a user to start chatting
                </div>
            </div>
        );
    }

    return (
        <div className="chat-area">
            <div className="chat-messages">
                {messages.map((message) => {
                    const isSentByCurrentUser = message.sender._id === currentUser._id;
                    return (
                        <div
                            key={message._id}
                            className={`message-container ${isSentByCurrentUser ? 'sent' : 'received'}`}
                        >
                            {!isSentByCurrentUser && (
                                <div className="message-avatar">
                                    {message.sender.profilePicture ? (
                                        <img 
                                            src={`http://localhost:5000/${message.sender.profilePicture}`}
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
                            <div className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}>
                                <div className="message-content">
                                    {message.content}
                                </div>
                                <div className="message-timestamp">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            {isSentByCurrentUser && (
                                <div className="message-avatar">
                                    {currentUser.profilePicture ? (
                                        <img 
                                            src={`http://localhost:5000/${currentUser.profilePicture}`}
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
                <button type="submit" className="send-button">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatArea;