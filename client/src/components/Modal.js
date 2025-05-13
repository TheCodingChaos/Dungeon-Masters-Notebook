import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css'

/**
 * A simple Modal component.
 * Props:
 * - isOpen: boolean to show/hide the modal
 * - onClose: function to call when close button is clicked
 * - children: the modal content
 */
export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const handleOverlayClick = onClose;
  const handleContentClick = function(event) {
    event.stopPropagation();
  };
  const handleCloseClick = onClose;

  // Build the modal markup
  const modalTree = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <button
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