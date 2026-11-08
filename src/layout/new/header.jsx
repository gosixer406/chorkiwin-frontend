import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { LockKeyhole, SquarePen } from "lucide-react";
import Reload from "@/components/reload";
import { setUser } from "@/lib/auth";
import {
  fetchFreshAccount,
  requestAccountRefresh,
} from "@/lib/refresh-account";
import logo from "@/assets/img/new/chorkiwala-logo.png";

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
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            aria-label="Log in to your account"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] bg-gold px-3 text-on-gold transition-opacity hover:opacity-90"
          >
            <LockKeyhole className="size-3.5" strokeWidth={2.5} />
            <span className="whitespace-nowrap font-poppins text-[12px] font-semibold leading-none">
              Log In
            </span>
          </Link>
          <Link
            to="/signup"
            aria-label="Sign up for an account"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] bg-linear-to-r from-[#95C04A] to-[#A1CD5E] px-3 text-[#1B2A0B] transition-opacity hover:opacity-90"
          >
            <SquarePen className="size-3.5" strokeWidth={2.5} />
            <span className="whitespace-nowrap font-poppins text-[12px] font-semibold leading-none">
              Sign Up
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}
