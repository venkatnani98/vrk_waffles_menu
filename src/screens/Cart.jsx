import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import AppHeader from "../components/AppHeader";

export default function Cart() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);


  const items = useCartStore(s => s.items);
  const increment = useCartStore(s => s.increment);
  const decrement = useCartStore(s => s.decrement);
  const clearCart = useCartStore(s => s.clear);

  const { name, phone } = useUserStore();

  const [loading, setLoading] = useState(false);

  const itemList = Object.values(items);

  const totalAmount = useMemo(() => {
    return itemList.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }, [itemList]);

  if (itemList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-sm text-slate-500 mb-4">
          Your cart is empty
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="text-sm text-[#8B4513] underline"
        >
          Go back to menu
        </button>
      </div>
    );
  }

const placeOrder = async () => {
  if (loading) return;
  setLoading(true);

  try {
    const today = new Date().toISOString().slice(0, 10);

    const dayRef = doc(db, "orders", today);
    const orderInfoRef = doc(db, "orders", "ordersInfo");
    const orderRef = doc(collection(db, "orders", today, "online"));

   const result = await runTransaction(db, async (transaction) => {
    // 1️⃣ READ ALL DOCS FIRST
    const daySnap = await transaction.get(dayRef);
    const infoSnap = await transaction.get(orderInfoRef);

    // 2️⃣ COMPUTE VALUES
    const nextCount = daySnap.exists()
      ? (daySnap.data().totalCount || 0) + 1
      : 1;

    const lastGlobal = infoSnap.exists()
      ? infoSnap.data().lastOrderId || 0
      : 0;

    const nextGlobalId = lastGlobal + 1;

    // 3️⃣ GENERATE ORDER NUMBER
    const yy = today.slice(2, 4);
    const mm = today.slice(5, 7);
    const dd = today.slice(8, 10);
    const orderNumber = `${yy}${mm}${dd}${String(nextCount).padStart(3, "0")}`;

    // 4️⃣ BUILD ITEMS
    const orderItems = {};
    itemList.forEach(item => {
      orderItems[item.id] = {
        name: item.name,
        qty: item.qty,
        price: item.price,
        amount: item.qty * item.price,
      };
    });

    // 5️⃣ NOW DO ALL WRITES
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

    return {
      orderId: nextGlobalId,
      orderNumber,
    };
  });


    clearCart();
    navigate(`/orders`);

  } catch (err) {
    console.error("Order failed:", err);
    alert("Failed to place order. Please try again.");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen flex flex-col bg-[#F3E4C4]">
      {/* HEADER */}
      <div className="p-4 pb-0">
        <AppHeader/>
      </div>
      <header className="px-4 py-3 border-b flex items-center justify-center gap-16">
        <h1 className="text-lg font-semibold text-[#8B4513] text-center">
          Cart
        </h1>
        <button
          onClick={() => navigate(-1)}
          className=" flex-1 text-lg text-[#8B4513] active:scale-90"
          aria-label="Go Back"
        >
          Back to Menu
        </button>
      </header>

      {/* ITEMS */}
      <main className="flex-1 px-4 py-3 space-y-4">
        {itemList.map(item => (
          <div
            key={item.id}
            className="flex justify-between items-center border-b pb-3"
          >
             <img
                src={item.image || "/no-image.svg"}
                alt={item.name}
                className="w-14 h-14 rounded-md object-cover bg-slate-100"
              />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {/* Veg / Non-Veg Dot */}
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    item.veg ? "bg-green-600" : "bg-[#7a1f1f]"
                  }`}
                  title={item.veg ? "Veg" : "Non-Veg"}
                />

                <p className="text-sm font-semibold text-[#8B4513] leading-tight">
                  {item.name}
                </p>
              </div>

              <p className="text-xs text-slate-500 mt-0.5">
                ₹{item.price} × {item.qty}
              </p>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => decrement(item.id)}
                className="w-7 h-7 flex items-center justify-center text-lg font-semibold text-[#8B4513] active:scale-90"
                aria-label="Decrease"
              >
                −
              </button>

              <span className="text-sm font-medium text-[#8B4513]">
                {item.qty}
              </span>

              <button
                onClick={() => increment(item.id)}
                className="w-7 h-7 flex items-center justify-center text-lg font-semibold text-[#8B4513] active:scale-90"
                aria-label="Increase"
              >
                +
              </button>
            
              <p className="text-sm font-semibold w-16 text-right" style={{color:"#8B4513"}}>
                ₹{item.price * item.qty}
              </p>
            </div>
          </div>
        ))}
      </main>

      {/* FOOTER */}
      <footer className="border-t px-4 py-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium" style={{color:"#8B4513"}}>Total</span>
          <span className="text-lg font-bold" style={{color:"#8B4513"}}>
            ₹{totalAmount}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 mb-3 leading-tight">
          Once the order is finalized, it cannot be modified here.
          To make changes, please contact or visit the counter within
          2 minutes of placing the order.
        </p>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="w-full bg-[#8B4513] text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-60"
        >
          {loading ? "Placing Order..." : "Finalize Order"}
        </button>

      </footer>

      {showConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white w-[85%] max-w-sm rounded-xl p-5 shadow-lg">
              <h2 className="text-base font-semibold text-[#8B4513] mb-2">
                Confirm Order
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Once you click <b>Okay</b>, your order will start preparing and cannot be modified.
                <br /><br />
                To modify or cancel the order, please reach the counter within <b>3 minutes</b> of placing it.
                <br />
                To add more items, place a <b>new order</b>.
                <br /><br />
                Once prepared, food cannot be cancelled or discarded.
              </p>


              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowConfirm(false);
                    placeOrder();
                  }}
                  className="flex-1 bg-[#8B4513] text-white rounded-lg py-2 text-sm font-semibold"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
