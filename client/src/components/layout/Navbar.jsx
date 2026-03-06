import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDateTime } from '../../utils/formatDate';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    { to: '/tasks', label: 'Tasks', roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    { to: '/eod', label: 'EOD', roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    { to: '/eod/templates', label: 'EOD Templates', roles: ['ADMIN', 'SUPERVISOR'] },
    { to: '/resources', label: 'Resources', roles: ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'] },
    { to: '/team', label: 'Team', roles: ['ADMIN', 'SUPERVISOR'] },
    { to: '/admin/users', label: 'Users', roles: ['ADMIN'] },
    { to: '/admin/organizations', label: 'Orgs', roles: ['ADMIN'] },
  ];

  const filteredLinks = navLinks.filter((link) => link.roles.includes(user.role));
  const recentNotifications = notifications.slice(0, 5);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-brand-600">
              GymTaskManager
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {filteredLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
                    ) : (
                      recentNotifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            markRead(n.id);
                            setShowNotifications(false);
                            if (n.type === 'TASK_ASSIGNED' || n.type === 'TASK_COMPLETED') {
                              navigate(`/tasks/${n.relatedId}`);
                            } else if (n.type === 'EOD_SUBMITTED') {
                              navigate(`/eod/submissions/${n.relatedId}`);
                            } else {
                              navigate('/eod');
                            }
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${!n.isRead ? 'bg-brand-50/50' : ''}`}
                        >
                          <p className="text-sm text-gray-800">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center py-3 text-sm text-brand-600 hover:text-brand-700 border-t"
                  >
                    View all
                  </Link>
                </div>
              )}
            </div>

            {/* User info */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.name} <span className="text-xs text-gray-400">({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 border-t">
            {filteredLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setShowMobileMenu(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 py-2 mt-2 border-t">
              <p className="text-sm text-gray-600 mb-2">{user.name} ({user.role})</p>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
