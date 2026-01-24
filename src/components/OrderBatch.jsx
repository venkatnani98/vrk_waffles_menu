function getStatusStyle(status) {
  const isActive =
    status !== "completed" && status !== "declined";

  const isDeclined = status === "declined";

  return {
    label: status.replace(/([A-Z])/g, " $1").toUpperCase(),

    text: isDeclined
      ? "text-gray-500"
      : isActive
      ? "text-green-600"
      : "text-[#8B4513]",

    dot: isDeclined
      ? "bg-gray-400"
      : isActive
      ? "bg-green-500 animate-pulseDot"
      : "bg-[#8B4513]",

    glow: isActive
      ? "shadow-[0_0_10px_rgba(34,197,94,0.6)]"
      : "",
  };
}

function OrderBatch({ order }) {
  const status = getStatusStyle(order.status);
  const isDeclined = order.status === "declined";

  return (
    <div
      className={`rounded-lg p-4 shadow-md w-full transition-all
        ${
          isDeclined
            ? "bg-gray-200 opacity-60 grayscale pointer-events-none"
            : "bg-white"
        }
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-sm font-semibold">
            Order #{order.orderId}
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
