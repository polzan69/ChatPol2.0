import { Link } from 'react-router-dom';
import './App.css';

function App() {
    return (
        <div>
            <h1>Welcome to Our App</h1>
            <nav>
                <Link to="/">Login</Link>
                <Link to="/signup">Sign Up</Link>
            </nav>
        </div>
    );
}

export default App;