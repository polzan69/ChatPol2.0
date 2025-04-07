import React from 'react';
import './css/ImageModal.css';

const ImageModal = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <img src={imageUrl} alt="Full size" className="full-size-image" />
            </div>
        </div>
    );
};

export default ImageModal; 