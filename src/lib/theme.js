import { useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";
const listeners = new Set();

const get_theme = () => (document.documentElement.classList.contains("dark") ? "dark" : "light");

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Light is the default; the choice lives on <html class="dark"> so Tailwind's `dark:` variant follows it.
// Every caller shares the same store, so the header and menu toggles stay in sync.
export function toggle_theme() {
  const next = get_theme() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, get_theme, () => "light");
  return { theme, toggle_theme };
}
