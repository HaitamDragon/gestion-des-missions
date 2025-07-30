import { createContext, useContext, useState } from 'react';
import Notification from './Notification';

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function StateManager({ children }) {
    const [notification, setNotification] = useState({ message: '', type: '' });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const clearNotification = () => {
        setNotification({ message: '', type: '' });
    };

    const value = {
        showNotification,
        clearNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            <Notification 
                message={notification.message}
                type={notification.type}
                onClose={clearNotification}
            />
            {children}
        </NotificationContext.Provider>
    );
}