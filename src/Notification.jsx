import { useEffect } from 'react';
import './Notification.css';

export default function Notification({ message, type, onClose }) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto-hide after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className={`notification ${type}`}>
            <span className="message">{message}</span>
        </div>
    );
}
