import { useEffect, useState, useMemo } from "react";
import { getCatalogueItems } from "../services/items";
import { useCartStore } from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useUserStore } from "../store/userStore";
import AppHeader from "../components/AppHeader";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [foodFilter, setFoodFilter] = useState("all");
  const [hasOrdersToday, setHasOrdersToday] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const cartItems = useCartStore(s => s.items);
  const addItem = useCartStore(s => s.addItem);
  const increment = useCartStore(s => s.increment);
  const decrement = useCartStore(s => s.decrement);

  const navigate = useNavigate();
  const { phone } = useUserStore();

/* ---------------- Store open/close listener ---------------- */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const docRef = doc(db, "orders", today);

    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        setStoreOpen(snap.data().storeOpen === true);
      } else {
        setStoreOpen(false);
      }
    });

    return () => unsub();
  }, []);


  /* ---------------- Orders today listener ---------------- */
  useEffect(() => {
    if (!phone) return;

    const today = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, "orders", today, "online"),
      where("phone", "==", phone)
    );

    const unsub = onSnapshot(q, snap => {
      setHasOrdersToday(!snap.empty);
    });

    return () => unsub();
  }, [phone]);

  /* ---------------- Load catalogue ---------------- */
  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getCatalogueItems();
    setItems(data);
  }

  /* ---------------- Veg / NonVeg filtering ---------------- */
  const foodFilteredItems = useMemo(() => {
    if (foodFilter === "veg") {
      return items.filter(i => i.veg === true);
    }
    if (foodFilter === "nonveg") {
      return items.filter(i => i.veg === false);
    }
    return items;
  }, [items, foodFilter]);

  /* ---------------- Categories WITH COUNT ---------------- */
  const categories = useMemo(() => {
    const map = {};
    foodFilteredItems.forEach(item => {
      map[item.category] = (map[item.category] || 0) + 1;
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
    }));
  }, [foodFilteredItems]);

  /* ---------------- Keep activeCategory valid ---------------- */
  useEffect(() => {
    if (!categories.length) {
      setActiveCategory(null);
      return;
    }

    if (!categories.some(c => c.name === activeCategory)) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  /* ---------------- Items shown in grid ---------------- */
  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    return foodFilteredItems.filter(
      item => item.category === activeCategory
    );
  }, [foodFilteredItems, activeCategory]);

  /* ---------------- Cart count ---------------- */
  const cartCount = useMemo(() => {
    return Object.values(cartItems).reduce(
      (sum, item) => sum + item.qty,
      0
    );
  }, [cartItems]);

  return (
    <div className="min-h-screen p-4 pb-28 bg-[#F3E4C4]">
      <AppHeader storeOpen={storeOpen} />

      {/* HEADER ROW */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-bold text-[#8B4513]">Menu</h1>

        {/* Veg / NonVeg Toggle */}
        <div className="flex border rounded-full overflow-hidden text-xs">
          {["all", "veg", "nonveg"].map(type => (
            <button
              key={type}
              onClick={() => setFoodFilter(type)}
              className={`px-3 py-1 transition ${
                foodFilter === type
                  ? type === "veg"
                    ? "bg-green-600 text-white"
                    : type === "nonveg"
                    ? "bg-[#7a1f1f] text-white"
                    : "bg-[#8B4513] text-white"
                  : "bg-white text-[#8B4513]"
              }`}
            >
              {type === "all" ? "All" : type === "veg" ? "Veg" : "Non-Veg"}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY TABS WITH FADE */}
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-2 category-fade">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-1 rounded-full text-sm whitespace-nowrap border transition-all ${
                activeCategory === cat.name
                  ? "bg-[#8B4513] text-white border-[#8B4513] scale-105"
                  : "bg-white text-[#8B4513] border-[#8B4513]/20"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>


      {/* ITEMS GRID WITH ANIMATION */}
      <div
        key={activeCategory}
        className="grid grid-cols-2 gap-3 animate-fadeIn"
      >
        {filteredItems.map(item => {
          const qty = cartItems[item.id]?.qty || 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm p-2 flex flex-col items-center transition-transform active:scale-95"
            >
              <div className="relative w-full">
                <img
                  src={item.image || "/no-image.svg"}
                  className="w-full h-20 object-cover rounded-lg"
                />

                <span
                  className={`absolute top-1 right-1 w-3 h-3 rounded-full border border-white ${
                    item.veg ? "bg-green-600" : "bg-[#7a1f1f]"
                  }`}
                />
              </div>

              <p className="mt-2 text-sm text-center font-semibold text-[#8B4513]">
                {item.name} (₹{item.price})
              </p>

              {qty === 0 ? (
                <button
                  onClick={() => addItem(item)}
                  className="mt-2 text-xs bg-[#8B4513] text-white px-3 py-1 rounded-full active:scale-95"
                >
                  Add
                </button>
              ) : (
                <div className="mt-2 flex items-center gap-2 bg-[#F3E4C4] rounded px-2 py-1">
                  <button onClick={() => decrement(item.id)}>-</button>
                  <span className="text-xs font-bold">{qty}</span>
                  <button onClick={() => increment(item.id)}>+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM BUTTONS */}
      {(cartCount > 0 || hasOrdersToday) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          {cartCount > 0 && (
            <button
              onClick={() => navigate("/cart")}
              className="relative bg-[#8B4513] text-white font-semibold w-36 h-16 rounded-full shadow-lg"
            >
              Cart
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </div>
            </button>
          )}

          {hasOrdersToday && (
            <button
              onClick={() => navigate("/orders")}
              className="bg-green-600 text-white font-semibold h-16 px-5 rounded-full shadow-lg"
            >
              My Today’s Orders
            </button>
          )}
        </div>
      )}
    </div>
  );
}
