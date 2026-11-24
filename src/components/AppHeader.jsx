import ThemeToggle from "./ThemeToggle";

export default function AppHeader({
  storeOpen = false,
  showStatus = true,
  compact = false,
}) {
  return (
    <header className={`hero waffle ${compact ? "is-compact" : ""}`}>
      <div className="hero-row">
        <img
          src="/waffle_dimension_logo.jpg"
          alt="Waffle Dimension Logo"
          width="64"
          height="64"
          loading="eager"
          decoding="async"
          className="hero-logo"
        />

        <div className="hero-text">
          <p className="hero-name">Waffle Dimension</p>

          {!compact && (
            <>
              <p className="hero-meta">Creative Nagar, A S Rao Nagar</p>
              <p className="hero-meta">
                Ph.{" "}
                <a className="hero-phone" href="tel:+917901333390">
                  9493706256
                </a>
              </p>
            </>
          )}
        </div>

        <div className="hero-actions">
          <ThemeToggle />
          {showStatus && (
            <span className={`status ${storeOpen ? "is-open" : ""}`}>
              {storeOpen ? "Open" : "Closed"}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
