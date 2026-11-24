export default function CartBubble({
  count = 0,
  total = 0,
  showOrders = false,
  onOpenCart,
  onOpenOrders,
}) {
  if (count === 0 && !showOrders) return null;

  return (
    <div className="dock">
      {showOrders && (
        <button
          onClick={onOpenOrders}
          className={`orders-btn ${count === 0 ? "is-wide" : ""}`}
        >
          My orders
        </button>
      )}

      {count > 0 && (
        <button
          onClick={onOpenCart}
          className="cart-bar waffle"
          aria-label={`View cart, ${count} items, total ${total} rupees`}
        >
          <span className="cart-info">
            <span className="cart-count">
              {count} {count === 1 ? "item" : "items"}
            </span>
            <span className="cart-total">₹{total}</span>
          </span>
          <span className="cart-cta">View cart</span>
        </button>
      )}
    </div>
  );
}
