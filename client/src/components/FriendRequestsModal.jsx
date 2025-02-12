const FriendRequestsModal = ({ isOpen, onClose, requests, onAccept, onReject }) => {
    if (!isOpen) return null;

    return (
        <div className="friend-requests-modal-overlay">
            <div className="friend-requests-modal">
                <h3>Friend Requests</h3>
                {requests.length > 0 ? (
                    requests.map(request => (
                        <div key={request._id} className="friend-request-item">
                            <div className="requester-info">
                                <img 
                                    src={request.sender.profilePicture ? `http://localhost:5000/${request.sender.profilePicture}` : '/default-avatar.png'} 
                                    alt={request.sender.firstName} 
                                    className="requester-pic"
                                />
                                <span>{request.sender.firstName} {request.sender.lastName}</span>
                            </div>
                            <div className="request-actions">
                                <button onClick={() => onAccept(request._id)} className="accept-btn">Accept</button>
                                <button onClick={() => onReject(request._id)} className="reject-btn">Reject</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No pending friend requests</p>
                )}
                <button onClick={onClose} className="close-btn">Close</button>
            </div>
        </div>
    );
};

export default FriendRequestsModal;