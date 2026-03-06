import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { formatDateTime } from '../utils/formatDate';

const typeIcons = {
  TASK_ASSIGNED: '📋',
  TASK_COMPLETED: '✅',
  EOD_SUBMITTED: '📝',
  EOD_REMINDER: '⏰',
  URGENT: '🚨',
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

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
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Mark all as read
          </button>
        )}
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
