/**
 * HireDesk Firebase Cloud Messaging service worker.
 *
 * Location is fixed by the FCM web SDK: it registers
 * "/firebase-messaging-sw.js" with scope "/". This file therefore has to be
 * served from the origin root, which means it lives in public/ and is never
 * processed by the bundler. As a result it must be plain JavaScript that pulls
 * the SDK off the CDN with importScripts rather than importing bare specifiers.
 *
 * The 12.19.0 version below is pinned to match the "firebase" dependency in
 * package.json. Bump both together.
 */

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

// Must match the NEXT_PUBLIC_FIREBASE_* values in frontend/.env.local.
// public/ is served statically, so this worker cannot read environment
// variables and needs its own copy of the web config.
firebase.initializeApp({
  apiKey: "AIzaSyAEWuEQTQLSrxOM-mD1ywrBpWCYXEskYBM",
  authDomain: "hiredesk-2fd1f.firebaseapp.com",
  projectId: "hiredesk-2fd1f",
  storageBucket: "hiredesk-2fd1f.firebasestorage.app",
  messagingSenderId: "901912576651",
  appId: "1:901912576651:web:8b68bc7737e9bffb538a8e",
});

// The VAPID key is intentionally absent here. It authorises the *browser* to
// subscribe, which happens on the page via getToken(), not in this worker. Only
// the public key ever reaches the client, and only the server holds a private one.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Background and closed-tab notifications are displayed by the Firebase
 * Messaging SDK itself, because the messages the backend sends carry a
 * "notification" payload. This worker therefore registers NO push handler and
 * NO onBackgroundMessage callback: instantiating messaging() is all that is
 * needed, and adding a display path on top of it is what produced two
 * notifications per message (one with an empty tag from the SDK, one tagged
 * "hiredesk-notification" from this file).
 *
 * The SDK does not handle clicks, so notificationclick below stays.
 *
 * Foreground messages never reach the service worker: they are handled by the
 * page (see NotificationPermissionButton).
 */
const messaging = firebase.messaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Messages sent today carry only a notification payload, so there is no
  // data.url to read and this falls back to the HireDesk home page.
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const windowClient of windowClients) {
        // Reuse an already-open HireDesk tab instead of opening a duplicate.
        if (windowClient.url.includes(self.location.origin) && "focus" in windowClient) {
          windowClient.navigate(targetUrl);
          return windowClient.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});

/**
 * Kept for manual verification in DevTools:
 *   firebaseMessaging.getToken().then(console.log)
 */
self.firebaseMessaging = messaging;
