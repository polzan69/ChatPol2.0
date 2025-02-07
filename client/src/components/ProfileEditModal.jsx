import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './css/ProfileEditModal.css';

const ProfileEditModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [age, setAge] = useState(user.age);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [preview, setPreview] = useState(user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : '');

    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setAge(user.age);
            setEmail(user.email);
            setPreview(user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : '');
        }
    }, [user]);

    const handlePreviewClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    };

    // Clean up preview URL when component unmounts or modal closes
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Reset preview when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPreview(user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : '');
            setProfilePicture(null);
        }
    }, [isOpen, user.profilePicture]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        
        // Only append values that have changed
        if (firstName !== user.firstName) formData.append('firstName', firstName);
        if (lastName !== user.lastName) formData.append('lastName', lastName);
        if (age !== user.age) formData.append('age', age);
        if (email !== user.email) formData.append('email', email);
        if (profilePicture) formData.append('profilePicture', profilePicture);
        if (password) formData.append('password', password);

        try {
            const response = await axios.put(
                `http://localhost:5000/api/users/editProfile/${user._id}`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                }
            );
            
            const updatedUser = {
                ...user,
                ...response.data,
                profilePicture: response.data.profilePicture
            };

            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            onUpdate(updatedUser);
            setProfilePicture(null);
            setPassword('');
            setCurrentPassword('');
            setNewPassword('');
            setShowPasswordFields(false);

            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
            
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handlePasswordChange = async () => {
        try {
            const verifyResponse = await axios.post(
                `http://localhost:5000/api/users/verifyPassword/${user._id}`,
                { currentPassword },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (verifyResponse.data.verified) {
                const formData = new FormData();
                formData.append('password', newPassword);

                const updateResponse = await axios.put(
                    `http://localhost:5000/api/users/editProfile/${user._id}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (updateResponse.data) {
                    setCurrentPassword('');
                    setNewPassword('');
                    setPasswordError('');
                    setShowPasswordFields(false);
                    
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    const updatedUser = { ...currentUser, ...updateResponse.data };
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    onUpdate(updatedUser);
                }
            }
        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordError(error.response?.data?.message || 'Failed to change password');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal-content">
                <h2>Edit Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="profile-form-group">
                        <label>Profile Picture:</label>
                        <div 
                            className="profile-picture-preview" 
                            onClick={handlePreviewClick}
                        >
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Profile Preview" 
                                    className="preview-image"
                                />
                            ) : (
                                <div className="preview-placeholder">
                                    <i className="fas fa-camera"></i>
                                    <span>Click to change</span>
                                </div>
                            )}
                            <div className="preview-overlay">
                                <span>Change Picture</span>
                            </div>
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            className="hidden-file-input"
                        />
                    </div>
                    <div className="profile-form-group">
                        <label>First Name:</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="profile-form-group">
                        <label>Last Name:</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                    <div className="profile-form-group">
                        <label>Age:</label>
                        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                    </div>
                    <div className="profile-form-group">
                        <label>Email:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="profile-form-group">
                        {!showPasswordFields ? (
                            <button 
                                type="button" 
                                className="change-password-button"
                                onClick={() => setShowPasswordFields(true)}
                            >
                                Change Password
                            </button>
                        ) : (
                            <div className="password-change-fields">
                                <div className="password-field">
                                    <label>Current Password:</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="password-field">
                                    <label>New Password:</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                {passwordError && <div className="password-error">{passwordError}</div>}
                                <div className="password-buttons">
                                    <button 
                                        type="button" 
                                        className="verify-password-button"
                                        onClick={handlePasswordChange}
                                    >
                                        Change Password
                                    </button>
                                    <button 
                                        type="button" 
                                        className="cancel-password-button"
                                        onClick={() => {
                                            setShowPasswordFields(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setPasswordError('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="button-group">
                        <button className="profile-button" type="submit">Update</button>
                        <button className="profile-button" type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditModal;