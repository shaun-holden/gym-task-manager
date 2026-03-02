import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useSocket();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socketRef?.current]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
}
