import { useEffect, useState } from "react";
import {
  getNotificationState,
  enableOrderNotifications,
  refreshTokenIfGranted,
} from "../services/firebase";

const DISMISS_KEY = "vrk_notify_dismissed_at";
const DISMISS_DAYS = 3;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function NotifyPrompt({ phone }) {
  // hidden | ask | ios | busy | on | denied
  const [view, setView] = useState("hidden");

  useEffect(() => {
    let alive = true;

    (async () => {
      const state = await getNotificationState();
      if (!alive) return;

      if (state === "granted") {
        refreshTokenIfGranted(phone);
        setView("hidden");
      } else if (state === "default") {
        setView(recentlyDismissed() ? "hidden" : "ask");
      } else if (state === "ios-install") {
        setView(recentlyDismissed() ? "hidden" : "ios");
      } else {
        setView("hidden");
      }
    })();

    return () => {
      alive = false;
    };
  }, [phone]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setView("hidden");
  };

  const turnOn = async () => {
    setView("busy");
    try {
      const result = await enableOrderNotifications(phone);
      setView(result.ok ? "on" : result.permission === "denied" ? "denied" : "hidden");
    } catch (err) {
      console.error("Enable notifications failed:", err);
      setView("hidden");
    }
  };

  if (view === "hidden") return null;

  if (view === "on") {
    return (
      <div className="notice" role="status">
        <p className="small">
          <b>Notifications are on.</b> We’ll tell you when your order status
          changes.
        </p>
        <button className="btn-mini" style={{ justifySelf: "start" }} onClick={() => setView("hidden")}>
          Got it
        </button>
      </div>
    );
  }

  if (view === "denied") {
    return (
      <div className="notice" role="status">
        <p className="small">
          Notifications are blocked for this site. To get order updates, allow
          notifications in your browser’s site settings.
        </p>
        <button className="btn-mini" style={{ justifySelf: "start" }} onClick={() => setView("hidden")}>
          Close
        </button>
      </div>
    );
  }

  if (view === "ios") {
    return (
      <div className="notice">
        <p className="heading">Get order updates on iPhone</p>
        <p className="small">
          iPhone only allows notifications for apps on the Home Screen. Tap the
          Share button in Safari, choose <b>Add to Home Screen</b>, then open
          the app from there.
        </p>
        <button className="btn-mini" style={{ justifySelf: "start" }} onClick={dismiss}>
          Not now
        </button>
      </div>
    );
  }

  return (
    <div className="notice">
      <p className="heading">Get order status updates</p>
      <p className="small">
        We’ll send a notification only when the status of your order changes,
        like when it’s ready to collect. We won’t use it for offers or anything
        else.
      </p>
      <div className="row" style={{ gap: 10 }}>
        <button
          className="btn btn-primary"
          style={{ height: 44, flex: 1 }}
          onClick={turnOn}
          disabled={view === "busy"}
        >
          {view === "busy" ? "Turning on…" : "Turn on notifications"}
        </button>
        <button
          className="btn btn-ghost"
          style={{ height: 44, width: "auto", padding: "0 16px" }}
          onClick={dismiss}
          disabled={view === "busy"}
        >
          Not now
        </button>
      </div>
    </div>
  );
}