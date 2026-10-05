"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMissingFirebaseEnvVars,
  getPushSupport,
  isFirebaseConfigured,
  onForegroundMessage,
  requestFcmToken,
  type PushSupport,
} from "@/lib/firebase";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { CheckCircleIcon } from "@/app/components/ui/Icons";

type PermissionState = NotificationPermission | "unknown";

const supportMessages: Record<Exclude<PushSupport, "ready">, string> = {
  unconfigured: "Push notifications are not configured yet.",
  "insecure-context":
    "Push notifications require a secure context (HTTPS, or localhost during development).",
  unsupported: "This browser does not support push notifications.",
};

export default function NotificationPermissionButton() {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const current = getPushSupport();
      setSupport(current);

      if (current === "ready") {
        setPermission(Notification.permission);
      }
    });
  }, []);

  // Foreground messages never reach the service worker, so the page has to
  // listen for them itself to prove the end-to-end path works.
  useEffect(() => {
    if (support !== "ready") {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void onForegroundMessage((payload) => {
      console.log("[HireDesk] Foreground FCM message:", payload);
    })
      .then((stop) => {
        unsubscribe = stop;
      })
      .catch(() => {
        // Browsers without window.nessaging (Safari) cannot deliver foreground
        // messages. The service worker path still works.
      });

    return () => {
      unsubscribe?.();
    };
  }, [support]);

  const handleEnable = useCallback(async () => {
    setBusy(true);
    setError("");
    setToken("");

    try {
      const result = await Notification.requestPermission();

      if (result !== "granted") {
        setPermission(result);
        setError(
          "Notification permission was not granted. Enable it in your browser's site settings to receive HireDesk alerts.",
        );
        return;
      }

      setPermission("granted");

      const fcmToken = await requestFcmToken();
      setToken(fcmToken);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not enable notifications. Check the Firebase configuration and try again.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const configured = isFirebaseConfigured();
  const blocked = permission === "denied";

  return (
    <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <CheckCircleIcon className="h-5 w-5" />
        </div>

        <h2 className="text-lg font-semibold text-slate-900">
          Browser Notifications
        </h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Get HireDesk alerts about new candidates, interviews, and feedback
        directly in your browser.
      </p>

      <div className="mt-5">
        {configured && support === "ready" && permission === "granted" && (
          <Alert variant="success" className="mb-4">
            Notifications are enabled for this browser.
          </Alert>
        )}

        {configured && support === "ready" && permission === "denied" && (
          <Alert variant="warning" className="mb-4">
            Notifications are blocked for this site. Re-enable them in your
            browser&apos;s site settings, then reload this page.
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {token && (
          <Alert variant="info" className="mb-4">
            <p className="font-semibold">
              FCM registration token (Phase 1 preview only)
            </p>
            <p className="mt-1 break-all font-mono text-xs">{token}</p>
            <p className="mt-2 text-xs">
              This token is not stored yet. Phase 2 will persist it against your
              HireDesk account.
            </p>
          </Alert>
        )}

        {!configured && (
          <Alert variant="info" className="mb-4">
            <p className="font-semibold">
              Firebase configuration required
            </p>
            <p className="mt-1">
              Set the following in <code>frontend/.env.local</code>, then
              restart the dev server:
            </p>
            <ul className="mt-2 list-inside list-disc font-mono text-xs">
              {getMissingFirebaseEnvVars().map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </Alert>
        )}

        {configured && support !== "ready" && (
          <Alert variant="warning" className="mb-4">
            {supportMessages[support]}
          </Alert>
        )}

        <Button
          variant="primary"
          onClick={handleEnable}
          isLoading={busy}
          disabled={
            busy ||
            blocked ||
            !configured ||
            support !== "ready" ||
            (permission === "granted" && Boolean(token))
          }
        >
          {busy ? "Enabling…" : "Enable notifications"}
        </Button>
      </div>
    </section>
  );
}