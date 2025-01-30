import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MessageBox from '../components/messageBox';

function SignUp() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
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
        <div>
            {message && <MessageBox message={message} type={messageType} onClose={handleCloseMessage} />}
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                />
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
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button type="submit">Sign Up</button>
            </form>
            <p>
                Already have an account? <button onClick={() => navigate('/')}>Login</button>
            </p>
        </div>
    );
}

export default SignUp;