import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { formatDateTime } from '../utils/formatDate';

export default function UrgentNotificationPopup() {
  const [urgents, setUrgents] = useState([]);
  const socketRef = useSocket();

  useEffect(() => {
    fetchUrgent();
  }, []);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handler = (notification) => {
      if (notification.type === 'URGENT') {
        setUrgents((prev) => [notification, ...prev]);
      }
    };

    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socketRef?.current]);

  async function fetchUrgent() {
    try {
      const res = await api.get('/api/notifications/urgent');
      setUrgents(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch urgent notifications:', err);
    }
  }

  async function acknowledge(id) {
    try {
      await api.patch(`/api/notifications/${id}/acknowledge`);
      setUrgents((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  }

  if (urgents.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <svg className="w-7 h-7 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h2 className="text-lg font-bold text-white">Urgent Notification</h2>
            <p className="text-red-100 text-xs">{urgents.length} message{urgents.length !== 1 ? 's' : ''} requiring acknowledgement</p>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {urgents.map((n) => (
            <div key={n.id} className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-1">{n.message}</p>
              <p className="text-xs text-gray-400 mb-3">{formatDateTime(n.createdAt)}</p>
              <button
                onClick={() => acknowledge(n.id)}
                className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
