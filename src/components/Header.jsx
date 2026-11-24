import AppHeader from "./AppHeader";

// Kept so existing imports keep working. Same look as the rest of the app.
export default function Header() {
  return <AppHeader compact showStatus={false} />;
}
