import { getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Firebase console -> Project settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

/**
 * Returns one of:
 *  "unsupported" | "ios-install" | "default" | "granted" | "denied"
 */
export async function getNotificationState() {
  if (typeof window === "undefined") return "unsupported";

  // iPhone/iPad only allow web notifications for apps added to the Home Screen
  if (isIOS() && !isStandalone()) return "ios-install";

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  const supported = await isSupported().catch(() => false);
  if (!supported) return "unsupported";

  return Notification.permission;
}

async function saveToken(phone) {
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );
  await navigator.serviceWorker.ready;

  const token = await getToken(getMessaging(getApp()), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("No notification token received");

  // Document id = token. The Cloud Function looks tokens up by phone.
  await setDoc(
    doc(db, "notificationTokens", token),
    { phone, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return token;
}

/** Call from a button tap. Shows the browser's permission prompt. */
export async function enableOrderNotifications(phone) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, permission };
  await saveToken(phone);
  return { ok: true, permission };
}

/** Keeps the saved token fresh when permission was already granted. */
export async function refreshTokenIfGranted(phone) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  try {
    await saveToken(phone);
  } catch (err) {
    console.warn("Could not refresh notification token:", err);
  }
}
