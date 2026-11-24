const KEY = "vrk_theme";

function systemMedia() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
}

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#7a3c10" : "#8b4513");
}

export function getTheme() {
  return (
    document.documentElement.dataset.theme ||
    (systemMedia()?.matches ? "dark" : "light")
  );
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  apply(theme);
}

let started = false;

/** Call once at startup. Uses the saved choice, else the phone's setting. */
export function initTheme() {
  if (started || typeof window === "undefined") return;
  started = true;

  const mq = systemMedia();
  apply(getStoredTheme() || (mq?.matches ? "dark" : "light"));

  // Follow the phone's setting until the user picks one with the toggle
  mq?.addEventListener?.("change", (e) => {
    if (!getStoredTheme()) apply(e.matches ? "dark" : "light");
  });
}
