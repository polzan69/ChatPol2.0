import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/ProfileEditModal.css';

const ProfileEditModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [age, setAge] = useState(user.age);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [preview, setPreview] = useState(user.profilePicture);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setAge(user.age);
            setEmail(user.email);
            setPreview(user.profilePicture);
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProfilePicture(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('age', age);
        formData.append('email', email);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/users/editProfile/${user._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onUpdate(response.data); // Call the onUpdate function to update the user details in the parent component
            onClose(); // Close the modal
        } catch (error) {
            console.error('Error updating profile:', error);
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
                        <div className="profile-picture-preview">
                            <img src={preview ? `http://localhost:5000/${preview}` : ''} alt="Profile Preview" />
                        </div>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
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
                        <label>Password:</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="profile-button" type="submit">Update</button>
                    <button className="profile-button" type="profile-button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditModal;