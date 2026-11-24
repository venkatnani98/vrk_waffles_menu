function getStatusStyle(status = "") {
  // "orderPlaced" -> "Order placed"
  const spaced = status.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  const label = spaced.charAt(0).toUpperCase() + spaced.slice(1);

  let tone = "active";
  if (status === "declined") tone = "declined";
  else if (status === "completed") tone = "done";
  else if (status === "orderReady") tone = "ready";

  return { label, tone };
}

function OrderBatch({ order, onPay }) {
  const status = getStatusStyle(order.status);
  const isDeclined = order.status === "declined";
  const isCompleted = order.status === "completed";

  const paid = order.paymentStatus === "paid";
  const chosenCounter = order.paymentMethod === "counter";
  const showPayment = !isDeclined && (paid || !isCompleted);
  const canPayOnline = !paid && !isDeclined && !isCompleted && Boolean(onPay);

  let payLabel = "Payment pending";
  if (paid) payLabel = "Paid online";
  else if (chosenCounter) payLabel = "Pay at counter";

  return (
    <article className={`order ${isDeclined ? "is-declined" : ""}`}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <p className="order-id">Order #{order.orderId}</p>
        <span className={`badge ${status.tone}`}>{status.label}</span>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {Object.values(order.items || {}).map((item, idx) => (
          <div key={idx} className="line-item">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>₹{item.amount}</span>
          </div>
        ))}
      </div>

      <div className="total-row">
        <span>Total</span>
        <span>₹{order.totalAmount}</span>
      </div>

      {showPayment && (
        <div className="pay-row">
          <span className={`pay-state ${paid ? "is-paid" : ""}`}>{payLabel}</span>
          {canPayOnline && (
            <button className="btn-mini" onClick={onPay}>
              {chosenCounter ? "Pay online instead" : "Pay online"}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export { OrderBatch };