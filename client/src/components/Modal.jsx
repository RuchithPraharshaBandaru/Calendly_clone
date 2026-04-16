/**
 * Modal Component
 * 
 * A reusable modal dialog with overlay backdrop.
 * Closes on overlay click or Escape key press.
 * Prevents body scroll when open.
 * 
 * Why custom modal vs headless-ui/radix?: No extra dependency needed.
 * This is a simple modal that covers all our use cases (confirm dialogs, 
 * forms). Libraries like Radix are great but overkill here.
 */

import { useEffect } from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content modal-${size}`} 
        onClick={(e) => e.stopPropagation()}  /* Prevent close on content click */
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
