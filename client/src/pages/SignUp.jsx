import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageBox from '../components/messageBox';
import './css/SignUp.css';

function SignUp() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleAgeChange = (e) => {
        const value = e.target.value;
        // Only allow positive numbers
        if (value === '' || (parseInt(value) >= 0 && !value.includes('.'))) {
            setAge(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('age', age);
        formData.append('email', email);
        formData.append('password', password);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/users/signup', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                setMessage('Account created successfully! You can now log in.');
                setMessageType('success');
                setTimeout(() => navigate('/'), 3000); // Redirect after 3 seconds
            }
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.message);
                setMessageType('error');
            } else {
                console.error('Error:', error);
            }
        }
    };

    const handleCloseMessage = () => {
        setMessage('');
        setMessageType('');
    };

    return (
        <div className="auth-container signup-container">
            {message && <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />}
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p className="auth-subtitle">Join our community today</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="auth-input-first-name"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="auth-input-last-name"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <input
                            type="number"
                            min="0"
                            placeholder="Age"
                            value={age}
                            onChange={handleAgeChange}
                            onKeyDown={(e) => {
                                // Prevent the minus sign
                                if (e.key === '-' || e.key === 'e') {
                                    e.preventDefault();
                                }
                            }}
                            required
                            className="auth-input age-input"
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>
                    <div className="form-group password-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="auth-input"
                            style={{ width: '81%' }}
                        />
                        <button 
                            type="button"
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                    <div className="form-group file-input-group">
                        <label className="file-input-label">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <span className="file-input-text">
                                {profilePicture ? profilePicture.name : 'Choose Profile Picture'}
                            </span>
                        </label>
                    </div>
                    <button type="submit" className="auth-button">Sign Up</button>
                </form>
                <div className="auth-footer">
                    <p>
                        Already have an account? 
                        <span 
                            onClick={() => navigate('/')} 
                            className="auth-link"
                        >
                            Login
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;