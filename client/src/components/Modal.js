import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css'

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const handleOverlayClick = onClose;
  const handleModalContentClick = (event) => {
    event.stopPropagation();
  };
  const handleCloseClick = onClose;

  // Build the modal markup
  const modalTree = (
    <div className="modal-overlay" onClick={handleOverlayClick} role="presentation">
      <div className="modal-content" onClick={handleModalContentClick} role="dialog" aria-modal="true" >
        <button
          type="button"
          onClick={handleCloseClick}
          className="modal-close"
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
  // Return portal so modal renders at top-level
  return ReactDOM.createPortal(modalTree, document.body);
}