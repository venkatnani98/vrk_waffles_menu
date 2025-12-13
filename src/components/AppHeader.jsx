export default function AppHeader({
  showStatus = true,
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <img
        src="/vrk-logo.svg"
        alt="VRK Waffles"
        className="w-32 h-32 rounded-full"
      />

      <div className="flex-1 leading-tight">
        <h2 className="text-sm font-semibold">
          Siddartha Nagar, Dammiguda
        </h2>

        <h3 className="text-xs">
          Ph. <span className="font-bold">7901333390</span>
        </h3>

        {showStatus && (
          <h3 className="text-xs">
            Waffle Store Status :
            <span className="ml-1 text-green-600 font-bold">
              Online
            </span>
          </h3>
        )}
      </div>
    </div>
  );
}
