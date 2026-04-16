/**
 * Toast Notification Component
 * 
 * Displays temporary success/error/info messages at the top of the screen.
 * Auto-dismisses after 3 seconds. Uses a simple state-based approach.
 * 
 * Alternative: react-toastify library — adds dependency for something
 * very simple to build. Our custom toast is ~50 lines and fully styled.
 */

import { useEffect } from 'react';
import './Toast.css';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Toast;
