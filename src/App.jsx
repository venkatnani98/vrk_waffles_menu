import { Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./screens/Onboarding";
import Menu from "./screens/Menu";
import Cart from "./screens/Cart";
import OrderStatus from "./screens/OrderStatus";

function App() {
  return (
    <div className="min-h-screen flex justify-center bg-[#F3E4C4]">
      <div className="w-full bg-white min-h-screen md:max-w-md shadow-sm">
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderStatus />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
