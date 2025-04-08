import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import './MessageList.css';

const MessageList = ({ messages, currentUserId }) => {
    const formatTimestamp = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (error) {
            return 'Unknown time';
        }
    };

    return (
        <div className="message-list">
            {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                
                return (
                    <div 
                        key={message._id} 
                        className={`message-container ${isOwnMessage ? 'own-message' : 'other-message'}`}
                    >
                        {!isOwnMessage && (
                            <div className="message-sender">{message.senderName}</div>
                        )}
                        <div className="message-content">
                            <div className="message-text">{message.content}</div>
                            <div className="message-timestamp">
                                {formatTimestamp(message.timestamp)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MessageList; 