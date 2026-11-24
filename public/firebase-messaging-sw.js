/* Firebase Cloud Messaging service worker.
 * Config is passed in the URL by src/services/firebase.js, so nothing to edit here.
 *
 * The server sends a `notification` payload, so FCM displays it automatically
 * when the app is closed or minimised. Don't call showNotification here
 * as well, or users will see duplicates.
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

firebase.messaging();

// Take over immediately when the worker is updated
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Foreground notifications (shown via reg.showNotification in firebase.js)
// don't get FCM's automatic click handling, so open /orders ourselves.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.FCM_MSG) return; // FCM handles its own clicks
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) {
            c.navigate("/orders").catch(() => {});
            return c.focus();
          }
        }
        return self.clients.openWindow("/orders");
      })
  );
});