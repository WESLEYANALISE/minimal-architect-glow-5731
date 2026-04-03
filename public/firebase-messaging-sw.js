// Firebase Messaging Service Worker
// Este arquivo DEVE estar na raiz do public para funcionar corretamente

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAbnRVAQxIawF9xEtz7d4CQ47_B4y9k5v0",
  authDomain: "direito-2a0f6.firebaseapp.com",
  projectId: "direito-2a0f6",
  storageBucket: "direito-2a0f6.firebasestorage.app",
  messagingSenderId: "1075192627119",
  appId: "1:1075192627119:web:faf51b31c3ee00d7a2f95a"
};

// URL base do Supabase para tracking
const SUPABASE_URL = 'https://izspjvegxdfgkgibpyst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y';

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Receber notificações em background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background:', payload);
  
  // Usar ícone customizado se disponível nos dados
  const customIcon = payload.data?.icone_url || '/logo.webp';
  
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: customIcon,
    badge: '/logo.webp',
    image: payload.notification?.image,
    vibrate: [200, 100, 200],
    tag: 'direito360-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      link: payload.data?.link || '/',
      notification_id: payload.data?.notification_id || null,
      ...payload.data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Clique na notificação - rastrear abertura
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificação clicada:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const notificationId = event.notification.data?.notification_id;
  const urlToOpen = event.notification.data?.link || '/';
  
  // Rastrear abertura se tiver notification_id
  if (notificationId) {
    event.waitUntil(
      fetch(`${SUPABASE_URL}/functions/v1/push-track-open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ notification_id: notificationId }),
      })
        .then(res => console.log('[SW] Abertura rastreada:', res.status))
        .catch(err => console.error('[SW] Erro ao rastrear abertura:', err))
        .then(() => openWindow(urlToOpen))
    );
  } else {
    event.waitUntil(openWindow(urlToOpen));
  }
});

function openWindow(urlToOpen) {
  return clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker instalado');
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker ativado');
  event.waitUntil(clients.claim());
});
