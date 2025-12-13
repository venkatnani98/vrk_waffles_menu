function getStatusStyle(status) {
  const active = status !== "completed";

  return {
    label: status.replace(/([A-Z])/g, " $1").toUpperCase(),
    text:
      active ? "text-green-600" : "text-[#8B4513]",
    dot:
      active ? "bg-green-500 animate-pulseDot" : "bg-[#8B4513]",
    glow:
      active ? "shadow-[0_0_10px_rgba(34,197,94,0.6)]" : "",
  };
}

function OrderBatch({ order }) {
  const status = getStatusStyle(order.status);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md w-full">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm font-semibold">
            Order #{order.orderNumber}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 font-bold text-sm ${status.text} ${status.glow}`}
        >
          <span
            className={`w-3 h-3 rounded-full ${status.dot}`}
          />
          {status.label}
        </div>
      </div>

      {/* ITEMS */}
      <div className="space-y-2">
        {Object.values(order.items).map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-sm"
          >
            <span>
              {item.name} × {item.qty}
            </span>
            <span>₹{item.amount}</span>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="border-t mt-3 pt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>₹{order.totalAmount}</span>
      </div>
    </div>
  );
}

export { OrderBatch };
