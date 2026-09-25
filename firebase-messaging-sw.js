importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCZtvImbyZmqoEoY1hYZcuCbUpIl3R1fhE",
  authDomain: "katarnolima-rw05.firebaseapp.com",
  projectId: "katarnolima-rw05",
  storageBucket: "katarnolima-rw05.firebasestorage.app",
  messagingSenderId: "965647612835",
  appId: "1:965647612835:web:b712367f0d8beb7c5bf816"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notifikasi Background:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/img/logo-resmi-karang-taruna.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
