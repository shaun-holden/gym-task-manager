import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const { data } = await api.get('/api/push/vapid-key');
      if (!data.publicKey) return false;

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      const json = subscription.toJSON();
      await api.post('/api/push/subscribe', {
        endpoint: json.endpoint,
        keys: json.keys,
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe error:', err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await api.post('/api/push/unsubscribe', { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      return false;
    }
  }, []);

  return { isSubscribed, isSupported, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
