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
 * Background and closed-tab notifications are displayed HERE, exactly once.
 *
 * The backend sends DATA-ONLY messages (no "notification" block) and that is
 * load-bearing. The Firebase Messaging SDK's push handler auto-displays a
 * notification whenever the payload carries a "notification" object, and it
 * does so unconditionally: in @firebase/messaging 12.19.0 the call to
 * showNotification() sits in onPush() *before* the onBackgroundMessage branch
 * and is gated only on `!!internalPayload.notification`. There is no flag,
 * option or export to suppress it. That auto-created Notification is created
 * but never renders as a visible popup on Windows, and adding a display path
 * on top of it is what previously produced two notifications per message.
 *
 * With no "notification" block that auto-display branch is skipped, so this
 * handler is the only thing that shows a notification.
 *
 * Foreground messages never reach the service worker: while a tab is visible
 * the SDK posts them to the window instead (see NotificationPermissionButton).
 */
const messaging = firebase.messaging();

const DEFAULT_TITLE = "HireDesk";
const DEFAULT_BODY = "You have a new notification.";

function readText(value) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

messaging.onBackgroundMessage(async (payload) => {
  const data = (payload && payload.data) || {};

  const title = readText(data.title) || DEFAULT_TITLE;
  const body = readText(data.body) || DEFAULT_BODY;

  try {
    await self.registration.showNotification(title, {
      body,
      // Only same-origin paths are ever navigated to, see notificationclick.
      data: { url: readText(data.url) },
    });
    console.info("[HireDesk FCM] showNotification resolved");
  } catch (error) {
    console.error("[HireDesk FCM] showNotification rejected", error);
    throw error;
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

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
