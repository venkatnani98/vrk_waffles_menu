export default function AppHeader({
  storeOpen = false,
  showStatus = true,
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <img
        src="/vrk-logo.svg"
        alt="VRK Waffles"
        className="w-20 h-20 rounded-full"
      />

      <div className="flex-1 leading-tight">
        <h2 className="text-sm font-semibold chocolate-text">
          Siddartha Nagar, Dammiguda
        </h2>

        <h3 className="text-xs chocolate-text">
          Ph. <span className="font-bold chocolate-text">7901333390</span>
        </h3>

        {showStatus && (
          <h3 className="text-xs mt-1 chocolate-text">
            Waffle Store Status :
            <span className={`ml-1 font-bold chocolate-text`}>
              {storeOpen ? "Online" : "Offline"}
            </span>
          </h3>
        )}
      </div>
    </div>
  );
}
