import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ChevronRight, Moon, Sun } from "lucide-react";
import Reload from "@/components/reload";
import { setUser } from "@/lib/auth";
import {
  fetchFreshAccount,
  requestAccountRefresh,
} from "@/lib/refresh-account";
import { useTheme } from "@/lib/theme";
import logo from "@/assets/img/new/chorkiwala-logo.png";
import { SIGNUP_URL } from "@/lib/links";

// Solid person-with-key mark from the Log in button artwork.
function LoginUserKeyIcon() {
  return (
    <svg
      className="size-4.5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="8.6" cy="6.4" r="4.4" />
      <path d="M5.5 11.6a5 5 0 0 0 6.2 0c.8.4 1.5.9 2 1.5a4.6 4.6 0 0 0-.7 2.9l-5.2 5.2H3.4a1 1 0 0 1-1-1v-2.6c0-2.6 1.3-4.9 3.1-6Z" />
      <path
        fillRule="evenodd"
        d="M17.6 10.6a3.9 3.9 0 1 1-1.4 7.6l-1 1h-1.5v1.4h-1.4V22H9.8a.5.5 0 0 1-.5-.5v-1.8l5-5a3.9 3.9 0 0 1 3.3-4.1Zm.7 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle_theme } = useTheme();
  const is_dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle_theme}
      aria-label={is_dark ? "Switch to light mode" : "Switch to dark mode"}
      title={is_dark ? "Light mode" : "Dark mode"}
      className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface text-gold transition-colors hover:bg-surface-2 sm:size-9"
    >
      {is_dark ? (
        <Sun className="size-4 sm:size-4.5" />
      ) : (
        <Moon className="size-4 sm:size-4.5" />
      )}
    </button>
  );
}

export default function Header() {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const wallet = user?.wallet || {};
  const balance = Number(wallet.available ?? wallet.main_balance ?? 0).toFixed(
    2,
  );
  const exposure = Number(wallet.exposure ?? 0).toFixed(2);

  const refreshAccount = useCallback(async () => {
    if (!isLoggedIn || refreshing) return;
    setRefreshing(true);
    try {
      dispatch(setUser(await fetchFreshAccount()));
    } catch {
      // Leave the last known balance on screen if the network is briefly unavailable.
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, isLoggedIn, refreshing]);

  useEffect(() => {
    const refresh = () => refreshAccount();
    window.addEventListener("velki:balance-changed", refresh);
    return () => window.removeEventListener("velki:balance-changed", refresh);
  }, [refreshAccount]);

  useEffect(() => {
    if (isLoggedIn) requestAccountRefresh();
  }, [isLoggedIn]);

  return (
    <header className="velki-site-header velki-site-header-dark sticky top-0 z-60 flex w-full items-center justify-between border-b border-line bg-bar px-2 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <Link
        to="/"
        className="ml-1 mr-6 h-8 w-24 shrink-0 sm:ml-3 sm:mr-7 sm:w-28"
        aria-label="Chorkiwala home"
      >
        <img
          src={logo}
          className="h-8 w-24 origin-left scale-125 object-contain object-left sm:w-28"
          alt="Chorkiwala"
        />
      </Link>
      {isLoggedIn ? (
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
          <div className="flex h-8 min-w-0 items-center gap-1.5 overflow-hidden rounded-md border border-line bg-surface pl-2 sm:h-9 sm:gap-2.5 sm:pl-3">
            <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap leading-none sm:gap-2.5">
              <span className="text-[11px] font-bold text-gold sm:text-[13px]">
                $ {balance}
              </span>
              <span className="h-3 w-px bg-line sm:h-3.5" />
              <span
                className="text-[10px] font-semibold text-[#FF4D4F] sm:text-[12px]"
              >
                <span className="mr-0.5 text-[9px] font-medium uppercase text-[#FF4D4F] sm:mr-1 sm:text-[10px]">
                  Exp
                </span>
                {exposure}
              </span>
            </div>
            <Reload
              className="text-ink-soft"
              buttonClassName="grid h-full shrink-0 place-items-center border-l border-line px-1.5 transition-opacity hover:opacity-70 disabled:opacity-40 sm:px-2.5"
              onClick={refreshAccount}
              label="Refresh balance"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sign up for an account"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] border-[1.5px] border-[#CFA822] bg-linear-to-br from-[#044440] to-[#022A24] pl-1.5 pr-3 text-white transition-opacity hover:opacity-90"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#CFA822]">
              <ChevronRight className="size-3.5" strokeWidth={3} />
            </span>
            <span className="whitespace-nowrap font-poppins text-[12px] font-bold leading-none">
              Sign up
            </span>
          </a>
          <Link
            to="/login"
            aria-label="Log in to your account"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] bg-linear-to-r from-[#EAC463] to-[#C09A3A] pl-2 pr-3 text-black transition-opacity hover:opacity-90"
          >
            <LoginUserKeyIcon />
            <span className="whitespace-nowrap font-poppins text-[12px] font-bold leading-none text-[#9B0000]">
              Log in
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}
