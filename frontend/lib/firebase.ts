import { getApp, getApps, initializeApp } from "firebase/app";

/**
 * Firebase is client-only and intentionally lazy. Nothing here runs during
 * server rendering: `firebase/messaging` is imported dynamically inside the
 * functions that need it, so Turbopack never evaluates browser globals on the
 * server pass.
 */

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/**
 * FCM hardcodes the worker path and scope, so these must match
 * public/firebase-messaging-sw.js being served from the origin root.
 */
export const FIREBASE_MESSAGING_SW_PATH = "/firebase-messaging-sw.js";
export const FIREBASE_MESSAGING_SW_SCOPE = "/";

function resolveConfig(): FirebaseWebConfig | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value)) {
    return null;
  }

  return config as FirebaseWebConfig;
}

function resolveVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || null;
}

/**
 * Names the variables that are still unset, so the UI can tell the developer
 * exactly what to fill in instead of failing at request time.
 */
export function getMissingFirebaseEnvVars(): string[] {
  const required: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID],
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET],
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID],
    ["NEXT_PUBLIC_FIREBASE_VAPID_KEY", process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY],
  ];

  return required.filter(([, value]) => !value).map(([name]) => name);
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseEnvVars().length === 0;
}

export type PushSupport = "ready" | "insecure-context" | "unsupported" | "unconfigured";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") {
    return "unsupported";
  }

  if (!isFirebaseConfigured()) {
    return "unconfigured";
  }

  if (!window.isSecureContext) {
    return "insecure-context";
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  return "ready";
}

function getFirebaseApp() {
  const config = resolveConfig();

  if (!config) {
    throw new Error("Firebase is not configured.");
  }

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(FIREBASE_MESSAGING_SW_PATH, {
    scope: FIREBASE_MESSAGING_SW_SCOPE,
    // A cached worker would keep serving a stale FCM handler after a deploy.
    updateViaCache: "none",
  });
}

/**
 * Phase 1 only. The returned token is displayed to the user and deliberately
 * not persisted anywhere: there is no storage for it until Phase 2 adds token
 * registration to the backend.
 */
export async function requestFcmToken(): Promise<string> {
  const vapidKey = resolveVapidKey();

  if (!vapidKey) {
    throw new Error("NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set.");
  }

  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  const { getMessaging, getToken } = await import("firebase/messaging");
  const messaging = getMessaging(getFirebaseApp());

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });
}

/**
 * Foreground message handler. Background and closed-tab messages are handled by
 * the service worker instead.
 */
export async function onForegroundMessage(
  handler: (payload: unknown) => void,
): Promise<() => void> {
  const { getMessaging, onMessage } = await import("firebase/messaging");
  return onMessage(getMessaging(getFirebaseApp()), handler);
}