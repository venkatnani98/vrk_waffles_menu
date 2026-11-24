import { useNavigate } from "react-router-dom";
import "./Home.css";

// ---- Images: copy your files into src/assets/home/ with these names ----
import logo from "../assets/home/logo.jpeg";        // logo_for_zomato.jpeg
import mapImg from "../assets/home/map.jpeg";        // Neon_Gold_Map_to_Waffle_Dimension.png
import poster from "../assets/home/pamplet.jpeg";   // Waffle_Dimension___Pamplet.png
import qr from "../assets/home/qr.jpeg";             // Chocolate_Waffle_QR_Code.png

// ---- Edit these details in one place ----
const PHONE_DISPLAY = "94937 06256";
const PHONE_TEL = "+919493706256";
const WHATSAPP_LINK =
  "https://wa.me/919493706256?text=" +
  encodeURIComponent("Hi Waffle Dimension, I'd like to place an order.");
// Replace with your exact Google Maps share link when you have it
const MAPS_LINK =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Waffle Dimension, A.S. Rao Nagar, ECIL, Hyderabad");
const ZOMATO_LINK = "https://zomato.onelink.me/xqzv/gb03pza5";  // add your Zomato store link
const SWIGGY_LINK = "https://www.swiggy.com/city/hyderabad/waffle-dimension-creative-nagar-maruthi-nagar-rest1095909";  // add your Swiggy store link
const TOING_LINK = "https://www.toingit.com/menu/1095909";  // add your Toing store link
const OWNLY_LINK = "https://ownly.food/app/brand/BR509295";  // add your Ownly store link
const ORDER_PATH = "/start"; // first screen of the ordering app

// Add product photos here, e.g. { src: waffle1, name: "Choco Waffle" }
const PRODUCTS = [];

const MENU = [
  ["Waffles", "Hot, crisp, and loaded with chocolate"],
  ["Pizza", "Fresh from the oven"],
  ["French fries", "Golden and salted"],
  ["Veg snacks", "Quick bites, any time"],
  ["Mojitos", "Cool and fizzy"],
];

function Partner({ href, name }) {
  const cls = "hm-chip" + (href ? "" : " hm-chip--off");
  return href ? (
    <a className={cls} href={href} target="_blank" rel="noreferrer">{name}</a>
  ) : (
    <span className={cls}>{name}</span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const order = () => navigate(ORDER_PATH);

  return (
    <main className="hm">
      {/* Hero */}
      <header className="hm-hero">
        <img className="hm-logo" src={logo} alt="Waffle Dimension" />
        <h1 className="hm-tagline">A new dimension of taste</h1>
        <p className="hm-sub">
          Waffles, pizza and more, starting at <b>₹30</b>.
        </p>
        <button className="hm-cta" onClick={order}>Order now</button>
        <a className="hm-link" href={`tel:${PHONE_TEL}`}>or call {PHONE_DISPLAY}</a>
      </header>

      {/* Menu */}
      <section className="hm-sec" aria-labelledby="menu-h">
        <h2 id="menu-h">What we serve</h2>
        <ul className="hm-menu">
          {MENU.map(([name, line]) => (
            <li key={name}>
              <span className="hm-menu-name">{name}</span>
              <span className="hm-menu-line">{line}</span>
            </li>
          ))}
        </ul>

        {PRODUCTS.length > 0 && (
          <div className="hm-gallery">
            {PRODUCTS.map((p) => (
              <figure key={p.name}>
                <img src={p.src} alt={p.name} loading="lazy" />
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <img className="hm-poster" src={poster} alt="Waffle Dimension menu poster" loading="lazy" />
        <button className="hm-cta hm-cta--wide" onClick={order}>See the menu and order</button>
      </section>

      {/* Location */}
      <section className="hm-sec" id="location" aria-labelledby="loc-h">
        <h2 id="loc-h">Find us</h2>
        <p>
          A.S. Rao Nagar, ECIL, Hyderabad. From the A.S. Rao Nagar – ECIL road,
          go straight for 800 m. You will pass Pista House and the Hanuman Temple,
          with Venkateswara Swamy Temple on the opposite side.
        </p>
        <img className="hm-map" src={mapImg} alt="Route map to Waffle Dimension" loading="lazy" />
        <div className="hm-row">
          <a className="hm-btn" href={MAPS_LINK} target="_blank" rel="noreferrer">Get directions</a>
          <figure className="hm-qr">
            <img src={qr} alt="QR code for directions" loading="lazy" />
            <figcaption>Scan for directions</figcaption>
          </figure>
        </div>
      </section>

      {/* Contact */}
      <section className="hm-sec" id="contact" aria-labelledby="ct-h">
        <h2 id="ct-h">Contact</h2>
        <p>Place an order or ask us anything.</p>
        <div className="hm-row hm-row--stack">
          <a className="hm-btn" href={`tel:${PHONE_TEL}`}>Call {PHONE_DISPLAY}</a>
          <a className="hm-btn hm-btn--ghost" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
            Chat on WhatsApp
          </a>
        </div>
        <p className="hm-small">Also on</p>
        <div className="hm-chips">
          <Partner href={ZOMATO_LINK} name="Zomato" />
          <Partner href={SWIGGY_LINK} name="Swiggy" />
          <Partner href={TOING_LINK} name="Toing" />
          <Partner href={OWNLY_LINK} name="Ownly" />
        </div>
      </section>

      {/* About */}
      <section className="hm-sec" id="about" aria-labelledby="ab-h">
        <h2 id="ab-h">About us</h2>
        <p>
          Waffle Dimension is a small food spot in Dr. A S Rao Nagar, ECIL, Hyderabad. We started with
          waffles and grew the menu to pizza, fries, veg snacks and mojitos.
          Everything is made fresh to order, and prices start at just ₹30, so a
          good snack never has to be a big spend.
        </p>
        <p>
          Order from this app for pickup or delivery, or find us on Zomato and Swiggy.
        </p>
      </section>

      {/* Privacy */}
      <section className="hm-sec" id="privacy" aria-labelledby="pv-h">
        <h2 id="pv-h">Privacy policy</h2>
        <details className="hm-details">
          <summary>Read our privacy policy</summary>
          <div className="hm-policy">
            <p><b>What we collect.</b> Your name, phone number, delivery address (if any) and the items you order. We collect this only to take and deliver your order.</p>
            <p><b>How we use it.</b> To confirm your order, contact you about it, and show your order status. We may message you on the phone number you give us about that order.</p>
            <p><b>Payments.</b> Payments are handled by our payment partner. We do not see or store your card, UPI PIN or bank details.</p>
            <p><b>Sharing.</b> We do not sell your data. We share it only with the people needed to complete your order, such as payment and delivery partners, or when the law requires it.</p>
            <p><b>Storage.</b> Some details, such as your theme and recent orders, are saved on your phone so the app works faster. You can clear them from your browser settings.</p>
            <p><b>Your choices.</b> To ask us to correct or delete your details, call or WhatsApp {PHONE_DISPLAY}.</p>
            <p className="hm-small">Last updated: November 2026.</p>
          </div>
        </details>
      </section>

      <footer className="hm-foot">
        <p>Dimensional flavours. Endless cravings.</p>
        <p className="hm-small">© {new Date().getFullYear()} Waffle Dimension · waffledimension.in</p>
      </footer>

      {/* Sticky order bar */}
      <div className="hm-bar">
        <button className="hm-cta hm-cta--wide" onClick={order}>Order now</button>
      </div>
    </main>
  );
}