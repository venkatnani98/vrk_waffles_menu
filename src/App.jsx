import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./screens/Home";
import Onboarding from "./screens/Onboarding";
import Menu from "./screens/Menu";
import Cart from "./screens/Cart";
import Payment from "./screens/Payment";
import OrderStatus from "./screens/OrderStatus";
import { initTheme } from "./services/theme";
import "./App.css";

// Apply the saved (or phone's) light/dark setting as early as possible
initTheme();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="app-outer">
      <div className="app-frame">
        <ScrollToTop />
        <Routes>
          {/* Landing page (new) */}
          <Route path="/" element={<Home />} />
          <Route path="/privacy-policy" element={<Home />} />
          {/* Existing app flow: Onboarding moved from "/" to "/start" */}
          <Route path="/start" element={<Onboarding />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pay/:date/:orderId" element={<Payment />} />
          <Route path="/orders" element={<OrderStatus />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;