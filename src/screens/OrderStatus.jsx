import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { localDate } from "../services/date";
import { useUserStore } from "../store/userStore";
import { OrderBatch } from "../components/OrderBatch";
import AppHeader from "../components/AppHeader";

export default function OrderStatus() {
  const navigate = useNavigate();

  const { phone } = useUserStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(() => localDate());

  const tingAudioRef = useRef(null);
  const readyAudioRef = useRef(null);
  const prevStatusesRef = useRef({});

  // No saved customer -> start at onboarding
  useEffect(() => {
    if (!phone) navigate("/", { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    const ting = new Audio("/sounds/statusChange.wav");
    const ready = new Audio("/sounds/orderReady.wav");
    ting.preload = "auto";
    ready.preload = "auto";
    tingAudioRef.current = ting;
    readyAudioRef.current = ready;
  }, []);

  // Pending = not finished, not declined, and not already paid online
  const { totalOrders, totalPendingAmount } = useMemo(() => {
    const pending = orders.filter(
      (o) =>
        o.status !== "completed" &&
        o.status !== "declined" &&
        o.paymentStatus !== "paid"
    );
    return {
      totalOrders: orders.length,
      totalPendingAmount: pending.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      ),
    };
  }, [orders]);

  useEffect(() => {
    if (!phone) return;

    const day = localDate();
    setToday(day);

    const q = query(
      collection(db, "orders", day, "online"),
      where("phone", "==", phone),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Detect status changes -> sound + vibration (once per snapshot)
        if (Object.keys(prevStatusesRef.current).length) {
          let played = false;

          data.forEach((order) => {
            const prevStatus = prevStatusesRef.current[order.id];

            if (
              prevStatus &&
              prevStatus !== order.status &&
              !["declined", "paymentPending"].includes(order.status) &&
              !played
            ) {
              if (order.status === "orderReady") {
                readyAudioRef.current?.play().catch(() => {});
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              } else {
                tingAudioRef.current?.play().catch(() => {});
              }
              played = true;
            }
          });
        }

        const statusMap = {};
        data.forEach((order) => {
          statusMap[order.id] = order.status;
        });
        prevStatusesRef.current = statusMap;

        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Orders listener failed:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [phone]);

  return (
    <div className="screen">
      <AppHeader compact showStatus={false} />

      <div className="topbar">
        <h1 className="title">Today’s orders</h1>
      </div>

      <main className="screen-body" style={{ display: "grid", gap: 12, alignContent: "start" }}>
        {loading && (
          <p className="small muted" style={{ textAlign: "center", padding: "40px 0" }}>
            Loading your orders…
          </p>
        )}

        {!loading && orders.length === 0 && (
          <div className="empty">
            <p>No orders yet today.</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <>
            <div className="summary">
              <div>
                <p className="stat-label">Total orders</p>
                <p className="stat-value">{totalOrders}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="stat-label">Pending payment</p>
                <p className="stat-value">₹{totalPendingAmount}</p>
              </div>
            </div>

            {orders.map((order) => (
              <OrderBatch
                key={order.id}
                order={order}
                onPay={() => navigate(`/pay/${today}/${order.id}`)}
              />
            ))}
          </>
        )}
      </main>

      <div className="dock">
        <button className="btn btn-primary" onClick={() => navigate("/menu")}>
          {orders.length === 0 && !loading ? "Browse the menu" : "Add new order"}
        </button>
      </div>
    </div>
  );
}