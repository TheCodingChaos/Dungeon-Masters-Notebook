import React from 'react';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}