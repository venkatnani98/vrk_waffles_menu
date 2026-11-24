import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { getCatalogueItems } from "../services/items";
import { db } from "../services/firebase";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import AppHeader from "../components/AppHeader";
import CartBubble from "../components/CartBubble";
import SmartImage, { prefetchImages } from "../components/SmartImage";

/* "ice cream & shakes" -> "Ice Cream & Shakes" (display only, data is untouched) */
const titleCase = (s) =>
  String(s || "").replace(/(^|\s)(\p{L})/gu, (_, space, ch) => space + ch.toUpperCase());

/* ---------------- Catalogue cache (stale-while-revalidate) ---------------- */
const CACHE_KEY = "vrk_catalogue_v1";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
let memoryCache = null;

function readCache() {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items) || Date.now() - parsed.at > CACHE_MAX_AGE) {
      return null;
    }
    memoryCache = parsed.items;
    return memoryCache;
  } catch {
    return null;
  }
}

function writeCache(items) {
  memoryCache = items;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ items, at: Date.now() }));
  } catch {
    /* storage full or blocked: ignore */
  }
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "nonveg", label: "Non-veg" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function Menu() {
  const [items, setItems] = useState(() => readCache() || []);
  const [status, setStatus] = useState(() => (readCache() ? "ready" : "loading"));
  const [reloadKey, setReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [foodFilter, setFoodFilter] = useState("all");
  const [hasOrdersToday, setHasOrdersToday] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [catSheet, setCatSheet] = useState(false);

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);

  const navigate = useNavigate();
  const { phone } = useUserStore();

  /* ---------------- Store open/close listener ---------------- */
  useEffect(() => {
    const docRef = doc(db, "orders", todayKey());
    const unsub = onSnapshot(docRef, (snap) => {
      setStoreOpen(snap.exists() ? snap.data().storeOpen === true : false);
    });
    return () => unsub();
  }, []);

  /* ---------------- Orders today listener ---------------- */
  useEffect(() => {
    if (!phone) return;
    const q = query(
      collection(db, "orders", todayKey(), "online"),
      where("phone", "==", phone)
    );
    const unsub = onSnapshot(q, (snap) => setHasOrdersToday(!snap.empty));
    return () => unsub();
  }, [phone]);

  /* ---------------- Load catalogue ---------------- */
  useEffect(() => {
    let alive = true;
    getCatalogueItems()
      .then((data) => {
        if (!alive) return;
        setItems(data);
        writeCache(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Menu load failed:", err);
        if (alive) setStatus((s) => (s === "ready" ? "ready" : "error"));
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /* ---------------- Warm the image cache ---------------- */
  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => {
      prefetchImages(items.slice(0, 40).map((i) => i.image));
    }, 1200);
    return () => clearTimeout(t);
  }, [items]);

  /* ---------------- Filtering ---------------- */
  const foodFilteredItems = useMemo(() => {
    if (foodFilter === "veg") return items.filter((i) => i.veg === true);
    if (foodFilter === "nonveg") return items.filter((i) => i.veg === false);
    return items;
  }, [items, foodFilter]);

  const categories = useMemo(() => {
    const map = {};
    foodFilteredItems.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [foodFilteredItems]);

  useEffect(() => {
    if (!categories.length) {
      setActiveCategory(null);
      return;
    }
    if (!categories.some((c) => c.name === activeCategory)) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  // Keep the active chip in view when the category changes (also from the sheet)
  useEffect(() => {
    document
      .querySelector(".chip.is-active")
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeCategory]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    return foodFilteredItems.filter((item) => item.category === activeCategory);
  }, [foodFilteredItems, activeCategory]);

  /* ---------------- Cart totals ---------------- */
  const { cartCount, cartTotal } = useMemo(() => {
    const list = Object.values(cartItems);
    return {
      cartCount: list.reduce((sum, i) => sum + i.qty, 0),
      cartTotal: list.reduce((sum, i) => sum + i.qty * i.price, 0),
    };
  }, [cartItems]);

  const retry = () => {
    setStatus("loading");
    setReloadKey((k) => k + 1);
  };

  const pickCategory = (name) => {
    setActiveCategory(name);
    setCatSheet(false);
    requestAnimationFrame(() => {
      document
        .getElementById("menu-top")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  return (
    <div className="screen">
      <AppHeader storeOpen={storeOpen} />

      {/* STICKY CONTROLS */}
      <div className="menu-controls">
        <div className="row between">
          <h1 className="title">Menu</h1>

          <div className="seg" role="group" aria-label="Food type">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                data-kind={f.id}
                aria-pressed={foodFilter === f.id}
                onClick={() => setFoodFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="cats-row">
            <div className="chips-wrap">
              <div className="chips" role="group" aria-label="Categories">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    aria-pressed={activeCategory === cat.name}
                    className={`chip ${activeCategory === cat.name ? "is-active" : ""}`}
                    onClick={() => setActiveCategory(cat.name)}
                  >
                    {titleCase(cat.name)}
                    <span className="count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="cat-btn"
              onClick={() => setCatSheet(true)}
              aria-label="Browse all categories"
              title="All categories"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ITEMS */}
      <main id="menu-top" className="screen-body">
        {status === "loading" && (
          <div className="dish-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dish is-skeleton">
                <div className="img-box" style={{ aspectRatio: "4 / 3" }} />
                <div className="dish-body">
                  <div className="line" />
                  <div className="line short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="empty">
            <p>Couldn’t load the menu. Check your connection and try again.</p>
            <button className="btn btn-primary" style={{ maxWidth: 200 }} onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && filteredItems.length === 0 && (
          <div className="empty">
            <p>No items in this filter yet.</p>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div key={activeCategory} className="dish-grid fade-in">
            {filteredItems.map((item, idx) => {
              const qty = cartItems[item.id]?.qty || 0;

              return (
                <article key={item.id} className="dish">
                  <div className="dish-media">
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      ratio="4 / 3"
                      priority={idx < 4}
                    />
                    <span className="dish-badge" title={item.veg ? "Veg" : "Non-veg"}>
                      <i className={`diet ${item.veg ? "" : "nonveg"}`} />
                    </span>
                  </div>

                  <div className="dish-body">
                    <p className="dish-name">{item.name}</p>

                    <div className="dish-foot">
                      <p className="price">₹{item.price}</p>

                      {qty === 0 ? (
                        <button className="btn-add" onClick={() => addItem(item)}>
                          Add
                        </button>
                      ) : (
                        <div className="stepper is-block">
                          <button
                            onClick={() => decrement(item.id)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            −
                          </button>
                          <span>{qty}</span>
                          <button
                            onClick={() => increment(item.id)}
                            aria-label={`Add one ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <CartBubble
        count={cartCount}
        total={cartTotal}
        showOrders={hasOrdersToday}
        onOpenCart={() => navigate("/cart")}
        onOpenOrders={() => navigate("/orders")}
      />

      {/* CATEGORY JUMP SHEET */}
      {catSheet && (
        <div className="scrim" onClick={() => setCatSheet(false)} role="presentation">
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cat-title" className="heading">
              Jump to category
            </h2>
            <ul className="cat-list">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <button
                    className={`cat-row ${activeCategory === cat.name ? "is-active" : ""}`}
                    onClick={() => pickCategory(cat.name)}
                  >
                    <span>{titleCase(cat.name)}</span>
                    <span className="muted small">{cat.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
