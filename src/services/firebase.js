import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

// ⚠️ Keep YOUR real values here (these are the ones you pasted, partly hidden)
const firebaseConfig = {
  apiKey: "AIzaSyBgUJ1_72-_8B5ImVpx3Xl19E8zzg8SuoQ",
  authDomain: "vrk-waffles-and-more.firebaseapp.com",
  projectId: "vrk-waffles-and-more",
  storageBucket: "vrk-waffles-and-more.firebasestorage.app",
  messagingSenderId: "1012150955992",
  appId: "1:1012150955992:web:f0481d8326236580798cad",
  measurementId: "G-7SPY6DVTR9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

/* ═══════════════════════════════════════════════════════════════
   PUSH NOTIFICATIONS
═══════════════════════════════════════════════════════════════ */

// Firebase console -> Project settings -> Cloud Messaging -> Web Push certificates
const VITE_FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// The service worker lives in /public. We hand it the config through the URL
// so the config only has to exist in this file.
const SW_URL =
  "/firebase-messaging-sw.js?" +
  new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  }).toString();

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

// Shows a notification when a message arrives while the app is open and visible
// (FCM only auto-shows notifications when the app is in the background).
let foregroundBound = false;
function listenForeground() {
  if (foregroundBound) return;
  foregroundBound = true;

  onMessage(getMessaging(app), async (payload) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const { title, body } = payload.notification || {};
      await reg.showNotification(title || "Order update", {
        body,
        tag: payload.data?.orderId
          ? `order-${payload.data.orderId}`
          : undefined,
        data: payload.data,
      });
    } catch (err) {
      console.warn("Could not show foreground notification:", err);
    }
  });
}

async function saveToken(phone) {
  if (!VITE_FIREBASE_VAPID_KEY) {
    throw new Error("VITE_FIREBASE_VAPID_KEY is missing in your .env file");
  }

  const registration = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;

  const token = await getToken(getMessaging(app), {
    vapidKey: VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("No notification token received");

  // Document id = token. The Cloud Function looks tokens up by phone.
  await setDoc(
    doc(db, "notificationTokens", token),
    { phone, updatedAt: serverTimestamp() },
    { merge: true }
  );

  listenForeground();
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
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  try {
    await saveToken(phone);
  } catch (err) {
    console.warn("Could not refresh notification token:", err);
  }
}

export { db, app, analytics };