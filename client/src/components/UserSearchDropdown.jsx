const UserSearchDropdown = ({ users, onSendRequest, onClose, currentUserFriends, pendingRequests }) => {
    return (
        <div className="search-dropdown">
            {users.length > 0 ? (
                users.map(user => {
                    // Check if this user is already a friend
                    const isAlreadyFriend = currentUserFriends.some(friend => friend._id === user._id);
                    
                    // Check if there's a pending request
                    const hasPendingRequest = pendingRequests.some(
                        request => request.receiver._id === user._id
                    );
                    
                    return (
                        <div key={user._id} className="search-result-item">
                            <img 
                                src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : '/default-avatar.png'} 
                                alt={user.firstName} 
                                className="search-profile-pic"
                            />
                            <span className="user-name">{user.firstName} {user.lastName}</span>
                            <span className="user-email">{user.email}</span>
                            {isAlreadyFriend ? (
                                <span className="already-friend-label">Friends</span>
                            ) : hasPendingRequest ? (
                                <span className="pending-request-label">Request Sent</span>
                            ) : (
                                <button 
                                    className="send-request-btn"
                                    onClick={() => onSendRequest(user._id)}
                                >
                                    Send Request
                                </button>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="no-results">No users found</div>
            )}
        </div>
    );
};

export default UserSearchDropdown;