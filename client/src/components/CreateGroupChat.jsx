import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/CreateGroupChat.css';

const CreateGroupChat = ({ isOpen, onClose, onGroupCreated, currentUser }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [availableFriends, setAvailableFriends] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/friends/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAvailableFriends(response.data);
        } catch (error) {
            console.error('Error fetching friends:', error);
            setError('Failed to fetch friends list');
        }
    };

    const handleMemberToggle = (userId) => {
        setSelectedMembers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            setError('Please enter a group name');
            return;
        }
        if (selectedMembers.length === 0) {
            setError('Please select at least one member');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/groups/create', 
                {
                    name: groupName,
                    members: selectedMembers
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            onGroupCreated(response.data);
            setGroupName('');
            setSelectedMembers([]);
            setError('');
            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            setError('Failed to create group chat');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="group-chat-modal-overlay">
            <div className="group-chat-modal">
                <div className="group-chat-header">
                    <h2>Create New Group Chat</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="group-chat-form">
                    <div className="form-group">
                        <label>Group Name:</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name"
                            className="group-name-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Select Members:</label>
                        <div className="members-list">
                            {availableFriends.map(friend => (
                                <div key={friend._id} className="member-item">
                                    <label className="member-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedMembers.includes(friend._id)}
                                            onChange={() => handleMemberToggle(friend._id)}
                                        />
                                        <div className="member-info">
                                            {friend.profilePicture ? (
                                                <img 
                                                    src={friend.profilePicture}
                                                    alt={`${friend.firstName}'s avatar`}
                                                    className="member-avatar"
                                                />
                                            ) : (
                                                <div className="member-avatar-placeholder">
                                                    {friend.firstName[0]}{friend.lastName[0]}
                                                </div>
                                            )}
                                            <span>{friend.firstName} {friend.lastName}</span>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                        <button type="submit" className="create-button">
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupChat; 