export default function Header() {
  return (
    <header className="w-full py-3 px-4 flex items-center gap-3 bg-[#F3E4C4] border-b border-[#8B4513]/20">
      <img
        src="/vrk-logo.svg"
        alt="Logo"
        className="w-30 h-30 rounded-full object-cover border border-[#8B4513]/30"
      />
      <div>
        <h2 className="text-lg font-bold text-[#8B4513] leading-none">
          Main Menu
        </h2>
      </div>
    </header>
  );
}
