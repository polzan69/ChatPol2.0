import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageBox from '../components/messageBox';
import io from 'socket.io-client';
import './css/Login.css';

const socket = io('http://localhost:5000', {
    transports: ['websocket'], // Use WebSocket transport
    withCredentials: true // Include credentials
});

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/users/login', {
                email,
                password,
            });

            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                // Fetch user data after login
                const userResponse = await axios.get(`http://localhost:5000/api/users/get/${response.data.user._id}`, {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`,
                    },
                });
                localStorage.setItem('currentUser', JSON.stringify(userResponse.data)); // Store user data

                // Register the user with the WebSocket server
                socket.emit('registerUser', response.data.user._id);

                // Update user status to Online
                await axios.put(`http://localhost:5000/api/users/updateStatus/${response.data.user._id}`, { status: 'Online' }, {
                    headers: {
                        Authorization: `Bearer ${response.data.token}`,
                    },
                });

                setMessage('Login successful!');
                setMessageType('success');
                setTimeout(() => navigate('/dashboard'), 3000); // Redirect after 3 seconds
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-container login-container">
            {message && <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />}
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome Back!</h1>
                    <p className="auth-subtitle">Please login to continue</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
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
                    <button type="submit" className="auth-button">Login</button>
                </form>
                <div className="auth-footer">
                    <p>
                        Don't have an account? 
                        <span 
                            onClick={() => navigate('/signup')} 
                            className="auth-link"
                        >
                            Sign Up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;