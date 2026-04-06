import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { formatDateTime } from '../utils/formatDate';
import toast from 'react-hot-toast';

const typeIcons = {
  TASK_ASSIGNED: '📋',
  TASK_COMPLETED: '✅',
  EOD_SUBMITTED: '📝',
  EOD_REMINDER: '⏰',
  URGENT: '🚨',
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const navigate = useNavigate();

  async function togglePush() {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success('Push notifications disabled');
    } else {
      const ok = await subscribe();
      if (ok) toast.success('Push notifications enabled');
      else toast.error('Could not enable push notifications');
    }
  }

  function handleClick(n) {
    markRead(n.id);
    if (n.type === 'TASK_ASSIGNED' || n.type === 'TASK_COMPLETED') {
      navigate(`/tasks/${n.relatedId}`);
    } else if (n.type === 'EOD_SUBMITTED') {
      navigate(`/eod/submissions/${n.relatedId}`);
    } else if (n.type === 'URGENT') {
      navigate('/dashboard');
    } else {
      navigate('/eod');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center gap-4">
          {isSupported && (
            <button
              onClick={togglePush}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isSubscribed
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {isSubscribed ? 'Push On' : 'Enable Push'}
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:bg-gray-50 transition-colors ${
                !n.isRead ? 'border-l-4 border-l-brand-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{typeIcons[n.type] || '🔔'}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
