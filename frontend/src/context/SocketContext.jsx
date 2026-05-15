import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO');
      });

      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message
          });
        }
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user, token]);

  const value = {
    socket,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
