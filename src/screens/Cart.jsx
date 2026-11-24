import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { db } from "../services/firebase";
import { localDate } from "../services/date";
import {
  collection,
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import AppHeader from "../components/AppHeader";
import SmartImage from "../components/SmartImage";

// Single source of truth for the "change or cancel" window shown to customers.
const EDIT_WINDOW_MIN = 3;

export default function Cart() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const clearCart = useCartStore((s) => s.clear);

  const { name, phone } = useUserStore();

  // No saved customer -> start at onboarding
  useEffect(() => {
    if (!phone) navigate("/", { replace: true });
  }, [phone, navigate]);

  const itemList = useMemo(() => Object.values(items), [items]);

  const totalAmount = useMemo(
    () => itemList.reduce((sum, item) => sum + item.price * item.qty, 0),
    [itemList]
  );

  if (itemList.length === 0) {
    return (
      <div className="screen">
        <AppHeader compact showStatus={false} />
        <div className="empty">
          <p>Your cart is empty.</p>
          <button
            className="btn btn-primary"
            style={{ maxWidth: 220 }}
            onClick={() => navigate("/menu")}
          >
            Browse the menu
          </button>
        </div>
      </div>
    );
  }

  const placeOrder = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Shop-local date (same helper used by Payment and My Orders)
      const today = localDate();

      const dayRef = doc(db, "orders", today);
      const orderInfoRef = doc(db, "orders", "ordersInfo");
      const orderRef = doc(collection(db, "orders", today, "online"));

      await runTransaction(db, async (transaction) => {
        // 1. Read everything first
        const daySnap = await transaction.get(dayRef);
        const infoSnap = await transaction.get(orderInfoRef);

        // 2. Compute values
        const nextCount = daySnap.exists()
          ? (daySnap.data().totalCount || 0) + 1
          : 1;

        const lastGlobal = infoSnap.exists()
          ? infoSnap.data().lastOrderId || 0
          : 0;

        const nextGlobalId = lastGlobal + 1;

        // 3. Order number: YYMMDD + 3-digit daily counter
        const yy = today.slice(2, 4);
        const mm = today.slice(5, 7);
        const dd = today.slice(8, 10);
        const orderNumber = `${yy}${mm}${dd}${String(nextCount).padStart(3, "0")}`;

        // 4. Build items
        const orderItems = {};
        itemList.forEach((item) => {
          orderItems[item.id] = {
            name: item.name,
            qty: item.qty,
            price: item.price,
            amount: item.qty * item.price,
          };
        });

        // 5. Writes
        transaction.set(dayRef, { totalCount: nextCount }, { merge: true });
        transaction.set(
          orderInfoRef,
          { lastOrderId: nextGlobalId },
          { merge: true }
        );
        transaction.set(orderRef, {
          orderId: nextGlobalId,
          orderNumber,
          name,
          phone,
          items: orderItems,
          totalAmount,
          status: "orderPlaced",
          createdAt: serverTimestamp(),
          source: "online",
        });
      });

      clearCart();
      // Next: let the customer choose Pay online / Pay at counter
      navigate(`/pay/${today}/${orderRef.id}`, { replace: true });
    } catch (err) {
      console.error("Order failed:", err);
      alert("Couldn’t place the order. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <AppHeader compact showStatus={false} />

      <div className="topbar">
        <button
          className="back-btn"
          onClick={() => navigate("/menu")}
          aria-label="Back to menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12 5l-5 5 5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Menu
        </button>
        <h1 className="title">Your cart</h1>
      </div>

      {/* ITEMS */}
      <main className="screen-body" style={{ paddingBottom: 24 }}>
        <div className="panel">
          {itemList.map((item) => (
            <div key={item.id} className="cart-row">
              <SmartImage
                src={item.image}
                alt={item.name}
                ratio="1 / 1"
                className="cart-thumb"
                priority
              />

              <div className="grow">
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <i
                    className={`diet ${item.veg ? "" : "nonveg"}`}
                    title={item.veg ? "Veg" : "Non-veg"}
                    style={{ marginTop: 2 }}
                  />
                  <p className="cart-name">{item.name}</p>
                </div>

                <p className="small muted" style={{ margin: "2px 0 10px" }}>
                  ₹{item.price} each
                </p>

                <div className="stepper is-light">
                  <button
                    onClick={() => decrement(item.id)}
                    aria-label={`Remove one ${item.name}`}
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    onClick={() => increment(item.id)}
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="price cart-line">₹{item.price * item.qty}</p>
            </div>
          ))}
        </div>
      </main>

      {/* CHECKOUT */}
      <footer className="checkout">
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="label" style={{ margin: 0 }}>
            Total
          </span>
          <span className="checkout-total">₹{totalAmount}</span>
        </div>

        <p className="tiny muted" style={{ marginBottom: 12 }}>
          After you finalize, the order can’t be changed here. To change or
          cancel, visit the counter within {EDIT_WINDOW_MIN} minutes.
        </p>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Finalizing…" : "Finalize order"}
        </button>
      </footer>

      {/* CONFIRMATION SHEET */}
      {showConfirm && (
        <div
          className="scrim"
          onClick={() => setShowConfirm(false)}
          role="presentation"
        >
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="heading">
              Finalize this order?
            </h2>

            <ul className="rules">
              <li>The kitchen starts preparing it right away.</li>
              <li>
                To change or cancel, visit the counter within {EDIT_WINDOW_MIN}{" "}
                minutes.
              </li>
              <li>To add more items, place a new order.</li>
              <li>Food that’s already prepared can’t be cancelled.</li>
            </ul>

            <div className="row" style={{ gap: 12 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirm(false)}
              >
                Go back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowConfirm(false);
                  placeOrder();
                }}
              >
                Yes, finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}