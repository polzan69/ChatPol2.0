const UserSearchDropdown = ({ users, onSendRequest, onClose }) => {
    return (
        <div className="search-dropdown">
            {users.length > 0 ? (
                users.map(user => (
                    <div key={user._id} className="search-result-item">
                        <img 
                            src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : '/default-avatar.png'} 
                            alt={user.firstName} 
                            className="search-profile-pic"
                        />
                        <span className="user-name">{user.firstName} {user.lastName}</span>
                        <span className="user-email">{user.email}</span>
                        <button 
                            className="send-request-btn"
                            onClick={() => onSendRequest(user._id)}
                        >
                            Send Request
                        </button>
                    </div>
                ))
            ) : (
                <div className="no-results">No users found</div>
            )}
        </div>
    );
};

export default UserSearchDropdown;