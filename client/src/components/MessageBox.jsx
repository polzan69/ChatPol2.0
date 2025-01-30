import React, { useEffect, useState } from 'react';
import './css/MessageBox.css';
import '@fortawesome/fontawesome-free/css/all.css';

const MessageBox = ({ message, type, onClose }) => {
    const [remainingTime, setRemainingTime] = useState(3); // 3 seconds
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(timer); // Clear the interval
                    setTimeout(() => {
                        setIsVisible(false);
                        onClose();
                    }, 1000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); 

        return () => clearInterval(timer);
    }, [onClose]);

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

    return (
        isVisible && (
            <div className={`message-box ${type} fade-in`}>
                <i className={icon}></i>
                <span>{message}</span>
                <button className="close-button" onClick={handleClose}>✖</button>
                <div className="loading-slider">
                    <div
                        className="slider"
                        style={{ width: `${(remainingTime / 3) * 100}%` }}
                    />
                </div>
            </div>
        )
    );
};

export default MessageBox;