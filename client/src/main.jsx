import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth';
import { SocketProvider } from './hooks/useSocket';

// Register service worker with auto-update
registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload to update?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Register push notification service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-push.js').catch((err) => {
    console.log('Push SW registration skipped:', err.message);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
);
