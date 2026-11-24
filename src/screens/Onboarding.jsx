import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export default function Onboarding() {
  const navigate = useNavigate();
  const { name: savedName, phone: savedPhone, setUser } = useUserStore();

  const [name, setName] = useState(savedName || "");
  const [phone, setPhone] = useState(savedPhone || "");
  const [error, setError] = useState("");

  const alreadyKnown = Boolean(savedName && savedPhone);

  // If user already exists, skip this screen
  useEffect(() => {
    if (alreadyKnown) navigate("/menu", { replace: true });
  }, [alreadyKnown, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setUser(name.trim(), phone.trim());
    navigate("/menu");
  };

  if (alreadyKnown) return null;

  return (
    <div className="screen">
      <section className="waffle intro">
        <img
          src="/waffle_dimension_logo.jpg"
          alt="Waffle Dimension Logo"
          width="112"
          height="112"
          loading="eager"
          decoding="async"
          className="intro-logo"
        />
        <h1 className="intro-name">Waffle Dimension</h1>
        <p className="intro-addr">Creative Nagar, A S Rao Nagar, Hyderabad</p>
      </section>

      <section className="sheet-panel">
        <h2 className="title">Who’s ordering?</h2>
        <p className="small muted" style={{ marginTop: 4, marginBottom: 20 }}>
          We use this only to match you with your orders.
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-invalid={error.toLowerCase().includes("name")}
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Mobile number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              maxLength={10}
              aria-invalid={error.toLowerCase().includes("mobile")}
            />
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
            Continue to menu
          </button>
        </form>
      </section>
    </div>
  );
}
