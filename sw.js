// GymPro Service Worker for Background & Lock-Screen Notifications
// Allows alerts even when app is closed or phone is locked

const CACHE_NAME = 'gympro-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Listen for background push events from FCM / Web Push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'GymPro • Membership Alert',
      body: event.data ? event.data.text() : 'Your gym membership is expiring soon! Renew now to prevent turnstile lockout.'
    };
  }

  const title = data.title || '⚠️ GymPro Membership Expiring Soon';
  const options = {
    body: data.body || 'Your membership is about to expire. Renew now to maintain uninterrupted biometric gate access.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || 'gympro-membership-expiry',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/?view=member&screen=renewal',
      timestamp: Date.now()
    },
    actions: [
      { action: 'renew', title: '⚡ Renew Membership' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Handle notification clicks (deep link to renewal screen)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/?view=member&screen=renewal';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', screen: 'renewal' });
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Listen for internal trigger messages from App / Background Scheduler
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_EXPIRY_NOTIFICATION') {
    const { memberName, daysLeft, planName } = event.data;
    const title = daysLeft <= 1 
      ? `🚨 Urgent: Membership Expires ${daysLeft === 0 ? 'Today' : 'Tomorrow'}!`
      : `⚠️ GymPro Reminder: ${daysLeft} Days Left`;
      
    const body = `Hi ${memberName || 'Member'}, your ${planName || 'Gym'} plan expires in ${daysLeft} days. Renew now to prevent biometric turnstile lock.`;

    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [300, 150, 300, 150, 400],
      tag: 'gympro-expiry-' + (event.data.memberId || 'alert'),
      renotify: true,
      requireInteraction: true,
      data: {
        url: '/?view=member&screen=renewal',
        timestamp: Date.now()
      },
      actions: [
        { action: 'renew', title: '⚡ Renew Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
