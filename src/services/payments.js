import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// Must match the region in functions/index.js
const REGION = "asia-south1";

const fns = () => getFunctions(getApp(), REGION);

export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Couldn’t load the payment window."));
    document.body.appendChild(script);
  });
}

/**
 * Starts an online payment for an order that already exists in Firestore.
 * The amount is read from Firestore on the server, never sent from the phone.
 *
 * Resolves with { status: "paid" | "cancelled" | "failed", message? }
 * Rejects with an Error (err.stage === "verify" if the payment may have gone
 * through but we couldn't confirm it yet).
 */
export async function payOnline({ date, orderId, name, phone }) {
  const Razorpay = await loadRazorpay();

  const createPaymentOrder = httpsCallable(fns(), "createPaymentOrder");
  const { data } = await createPaymentOrder({ date, orderId });

  return new Promise((resolve, reject) => {
    let finished = false;
    let lastError = "";

    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: "Waffle Dimension",
      description: `Order #${data.orderNumber || ""}`.trim(),
      prefill: { name, contact: phone },
      theme: { color: "#8B4513" },

      handler: async (response) => {
        finished = true;
        try {
          const verifyPayment = httpsCallable(fns(), "verifyPayment");
          await verifyPayment({
            date,
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve({ status: "paid" });
        } catch (err) {
          err.stage = "verify";
          reject(err);
        }
      },

      modal: {
        ondismiss: () => {
          if (finished) return;
          finished = true;
          resolve({
            status: lastError ? "failed" : "cancelled",
            message: lastError,
          });
        },
      },
    });

    // Razorpay lets the customer retry inside the window, so just remember it
    checkout.on("payment.failed", (resp) => {
      lastError = resp?.error?.description || "Payment failed";
    });

    checkout.open();
  });
}
