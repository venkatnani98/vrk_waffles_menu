import { useEffect, useState } from "react";
import { useUserStore } from "../store/userStore";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { OrderBatch } from "../components/OrderBatch";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { useRef } from "react";



export default function OrderStatus() {
  const navigate = useNavigate();

  const { phone } = useUserStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const tingAudioRef = useRef(null);
  const readyAudioRef = useRef(null);
  const prevStatusesRef = useRef({});


  useEffect(() => {
    tingAudioRef.current = new Audio("/sounds/statusChange.wav");
    readyAudioRef.current = new Audio("/sounds/orderReady.wav");
  }, []);


  

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    order => order.status !== "completed"
  );

  const totalPendingAmount = pendingOrders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0
  );


  useEffect(() => {
    if (!phone) return;

    const today = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, "orders", today, "online"),
      where("phone", "==", phone),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔔 Detect status changes
      if (Object.keys(prevStatusesRef.current).length) {
        let played = false;

        data.forEach(order => {
          const prevStatus = prevStatusesRef.current[order.id];

          if (prevStatus && prevStatus !== order.status && !played) {
            if (order.status === "ready") {
              readyAudioRef.current?.play().catch(() => {});
              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }
            } else {
              tingAudioRef.current?.play().catch(() => {});
            }
            played = true; // only once per snapshot
          }
        });
      }

      // Update previous statuses
      const statusMap = {};
      data.forEach(order => {
        statusMap[order.id] = order.status;
      });
      prevStatusesRef.current = statusMap;

      setOrders(data);
      setLoading(false);
    });



    return () => unsub();
  }, [phone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">
          No orders found for today.
        </p>
      </div>
    );
  }
   
 return (
  <div className="min-h-screen bg-[#F3E4C4] p-3 space-y-4">
    <div className="p-4 pb-0">
            <AppHeader/>
          </div>
    {/* HEADER SUMMARY */}
    <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex justify-between items-center">
      <div>
        <p className="text-xs text-slate-500">Total Orders</p>
        <p className="text-lg font-bold text-[#8B4513]">
          {totalOrders}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs text-slate-500">
          Pending To Be Paid
        </p>
        <p className="text-lg font-bold text-green-600">
          ₹{totalPendingAmount}
        </p>
      </div>
    </div>

    {/* ORDER LIST */}
    {orders.map(order => (
      <OrderBatch key={order.id} order={order} />
    ))}

    {/* ADD NEW ORDER BUTTON */}
    <div className="flex justify-center pt-4">
      <button
        onClick={() => navigate("/menu")}
        className="w-[60%] bg-[#8B4513] text-white font-semibold py-3 rounded-full shadow-md active:scale-95"
      >
        Add New Order
      </button>
    </div>

  </div>
);

}
