import { ServiceUnavailableException } from '@nestjs/common';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let messaging: Messaging | null = null;

/**
 * Returns the Firebase Cloud Messaging instance, initializing the Admin SDK on
 * first use.
 *
 * Initialization is deliberately lazy: nothing is read from the environment at
 * import time, so the application still boots when Firebase is not configured
 * and subscribe keeps working. Credentials are only required by the paths that
 * actually send a message.
 *
 * The private key never appears in an error message.
 */
export function getFirebaseMessaging(): Messaging {
  if (messaging) {
    return messaging;
  }

  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY'];

  if (!projectId || !clientEmail || !privateKey) {
    throw new ServiceUnavailableException(
      'Push notification delivery is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY on the server.',
    );
  }

  let app: App | undefined = getApps()[0];

  try {
    if (!app) {
      // A service account pasted into a single-line environment variable keeps
      // its line breaks as literal "\n" sequences, which PEM parsing rejects.
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }

    messaging = getMessaging(app);
  } catch {
    throw new ServiceUnavailableException(
      'Push notification delivery could not be initialised. Verify the Firebase Admin credentials configured on the server.',
    );
  }

  return messaging;
}
