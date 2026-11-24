import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useUserStore } from "../store/userStore";
import { payOnline } from "../services/payments";
import AppHeader from "../components/AppHeader";

export default function Payment() {
  const { date, orderId } = useParams();
  const navigate = useNavigate();
  const { name, phone } = useUserStore();

  const [order, setOrder] = useState(null);
  const [view, setView] = useState("loading"); // loading | ready | missing
  const [busy, setBusy] = useState(null); // "counter" | "online" | null
  const [message, setMessage] = useState("");
  const [needsCheck, setNeedsCheck] = useState(false);

  // No saved customer -> start at onboarding
  useEffect(() => {
    if (!phone) navigate("/", { replace: true });
  }, [phone, navigate]);

  // Live order: also picks up the "paid" update if the webhook lands first
  useEffect(() => {
    const ref = doc(db, "orders", date, "online", orderId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists() || (phone && snap.data().phone !== phone)) {
          setView("missing");
          return;
        }
        setOrder({ id: snap.id, ...snap.data() });
        setView("ready");
      },
      () => setView("missing")
    );
    return () => unsub();
  }, [date, orderId, phone]);

  const payAtCounter = async () => {
    setBusy("counter");
    try {
      await updateDoc(doc(db, "orders", date, "online", orderId), {
        paymentMethod: "counter",
      });
    } catch (err) {
      // Not critical: the order is already placed. Carry on.
      console.warn("Could not save payment choice:", err);
    }
    navigate("/orders", { replace: true });
  };

  const startOnline = async () => {
    setBusy("online");
    setMessage("");
    setNeedsCheck(false);

    try {
      const result = await payOnline({ date, orderId, name, phone });

      if (result.status === "paid") {
        navigate("/orders", { replace: true });
      } else if (result.status === "failed") {
        setMessage("The payment didn’t go through. Try again or pay at the counter.");
      } else {
        setMessage("Payment cancelled. Choose how you’d like to pay.");
      }
    } catch (err) {
      console.error("Online payment error:", err);
      if (err.stage === "verify") {
        setNeedsCheck(true);
        setMessage(
          "We’re confirming your payment. If money was taken, your order will show as paid in a minute."
        );
      } else {
        setMessage("Couldn’t start online payment. Try again or pay at the counter.");
      }
    } finally {
      setBusy(null);
    }
  };

  const paid = order?.paymentStatus === "paid";
  const chosenCounter = order?.paymentMethod === "counter";

  return (
    <div className="screen">
      <AppHeader compact showStatus={false} />

      <div className="topbar">
        <h1 className="title">Payment</h1>
      </div>

      <main
        className="screen-body"
        style={{ display: "grid", gap: 16, alignContent: "start" }}
      >
        {view === "loading" && (
          <p className="small muted" style={{ textAlign: "center", padding: "40px 0" }}>
            Loading your order…
          </p>
        )}

        {view === "missing" && (
          <div className="empty">
            <p>We couldn’t find this order.</p>
            <button
              className="btn btn-primary"
              style={{ maxWidth: 220 }}
              onClick={() => navigate("/orders")}
            >
              My orders
            </button>
          </div>
        )}

        {view === "ready" && order && (
          <>
            <div className="summary">
              <div>
                <p className="stat-label">Order</p>
                <p className="stat-value">#{order.orderId}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="stat-label">{paid ? "Paid" : "Amount to pay"}</p>
                <p className="stat-value">₹{order.totalAmount}</p>
              </div>
            </div>

            {paid ? (
              <div className="notice" role="status">
                <p className="heading">Payment received</p>
                <p className="small">Thank you. Your order is being taken care of.</p>
              </div>
            ) : (
              <>
                <p className="small muted">
                  Your order is placed and the kitchen is on it. Choose how
                  you’d like to pay.
                </p>

                {chosenCounter && (
                  <div className="notice" role="status">
                    <p className="small">
                      You chose to pay at the counter. You can still pay online
                      now instead.
                    </p>
                  </div>
                )}

                {message && (
                  <p className="pay-message" role="alert">
                    {message}
                  </p>
                )}

                <button
                  className="pay-option is-primary"
                  onClick={startOnline}
                  disabled={busy !== null}
                >
                  <span className="pay-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <path d="M2 10h20M6 15h4" />
                    </svg>
                  </span>
                  <span className="grow">
                    <span className="pay-title" style={{ display: "block" }}>
                      {busy === "online"
                        ? "Opening payment…"
                        : chosenCounter
                        ? "Pay online instead"
                        : "Pay online"}
                    </span>
                    <span className="pay-desc">UPI, cards and netbanking</span>
                  </span>
                </button>

                <button
                  className="pay-option"
                  onClick={payAtCounter}
                  disabled={busy !== null}
                >
                  <span className="pay-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l1.5-5h15L21 9" />
                      <path d="M4 9v11h16V9" />
                      <path d="M9 20v-6h6v6" />
                    </svg>
                  </span>
                  <span className="grow">
                    <span className="pay-title" style={{ display: "block" }}>
                      {busy === "counter"
                        ? "Saving…"
                        : chosenCounter
                        ? "Keep pay at counter"
                        : "Pay at counter"}
                    </span>
                    <span className="pay-desc">Pay when you collect your order</span>
                  </span>
                </button>
              </>
            )}
          </>
        )}
      </main>

      <div className="dock">
        <button
          className="btn btn-ghost"
          onClick={() => navigate("/orders", { replace: true })}
          disabled={busy !== null && !needsCheck}
        >
          {paid || needsCheck ? "View my orders" : "Decide later"}
        </button>
      </div>
    </div>
  );
}