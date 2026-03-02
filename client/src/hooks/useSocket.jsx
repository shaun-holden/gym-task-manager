import { createContext, useContext, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const url = import.meta.env.VITE_API_URL || window.location.origin;
      socketRef.current = io(url, {
        auth: { token: localStorage.getItem('token') },
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join:user', { userId: user.id });
        if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
          socketRef.current.emit('join:management');
        }
      });

      return () => {
        socketRef.current?.disconnect();
        socketRef.current = null;
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
