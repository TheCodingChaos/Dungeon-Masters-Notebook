import React from 'react';

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '4px',
          minWidth: '300px',
          maxWidth: '90%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
          aria-label="Close modal"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}