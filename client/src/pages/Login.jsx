import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageBox from '../components/messageBox';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
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

    return (
        <div>
            {message && <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />}
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p>
                Don't have an account? <button onClick={() => navigate('/signup')}>Sign Up</button>
            </p>
        </div>
    );
}

export default Login;