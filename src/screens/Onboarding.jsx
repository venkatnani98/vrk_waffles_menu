import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export default function Onboarding() {
  const navigate = useNavigate();
  const { name: savedName, phone: savedPhone, setUser } = useUserStore();

  const [name, setName] = useState(savedName || "");
  const [phone, setPhone] = useState(savedPhone || "");
  const [error, setError] = useState("");

  // If user already exists, skip this screen
  useEffect(() => {
    if (savedName && savedPhone) {
      navigate("/menu");
    }
  }, [savedName, savedPhone, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setUser(name.trim(), phone.trim());
    navigate("/menu");
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6">
      <div className="flex-1 flex flex-col justify-center">
       <div className="mb-8 text-center flex flex-col items-center">
          <img
            src="/vrk-logo.svg"
            alt="VRK Waffles"
            className="w-48 h-48 mb-3"
          />

          <p className="text-sm font-semibold text-[#8B4513]">
            VRK Waffles & More
          </p>

          <p className="text-xs text-slate-500 mt-1 text-center leading-snug">
            Siddartha Nagar, Dammiguda<br />
            Hyderabad
          </p>

          <p className="text-sm text-slate-500 mt-3">
            Please tell us who&apos;s ordering
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit number"
              maxLength={10}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 text-white font-semibold py-2 rounded-lg mt-2 text-sm active:scale-[0.98] transition"
          >
            Continue to Menu
          </button>
        </form>
      </div>

      <p className="text-[14px] text-center text-slate-400 mt-4">
        Your name & mobile are only used for your order.
      </p>
    </div>
  );
}
