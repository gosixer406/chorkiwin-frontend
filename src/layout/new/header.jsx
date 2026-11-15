import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { LockKeyhole, SquarePen } from "lucide-react";
import Reload from "@/components/reload";
import { setUser, setWallet } from "@/lib/auth";
import {
  refreshBalanceFast,
  requestAccountRefresh,
} from "@/lib/refresh-account";
import logo from "@/assets/img/logo/short_logo_3d.png";
import LoadingDots from "@/components/loading-dots";

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
      await refreshBalanceFast({
        onWallet: (nextWallet) => dispatch(setWallet(nextWallet)),
        onAccount: (account) => dispatch(setUser(account)),
      });
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

  // Signed in (or the page opened signed in): fetch the balance right away,
  // with the loader in the header (the listener above runs refreshAccount).
  useEffect(() => {
    if (!isLoggedIn) return;
    window.dispatchEvent(new Event("velki:balance-changed"));
    requestAccountRefresh();
  }, [isLoggedIn]);

  return (
    <header className="velki-site-header velki-site-header-dark sticky top-0 z-60 flex w-full items-center justify-between border-b border-line bg-bar px-2 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <Link
        to="/"
        className="ml-1 mr-6 h-8 w-24 shrink-0 sm:ml-3 sm:mr-7 sm:w-28"
        aria-label="chorkix.com home"
      >
        <img
          src={logo}
          className="h-8 w-24 origin-left scale-125 object-contain object-left sm:w-28"
          alt="chorkix.com"
        />
      </Link>
      {isLoggedIn ? (
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <div className="flex h-8 min-w-0 items-center gap-2 sm:h-9 sm:gap-2.5">
            {/* Main and Exp on one line; one loader for both while refreshing. */}
            <div
              className="flex shrink-0 items-center gap-2 whitespace-nowrap leading-none"
              aria-busy={refreshing}
            >
              {refreshing ? (
                <LoadingDots className="text-gold" />
              ) : (
                <>
                  <span className="text-[11px] font-bold text-gold sm:text-[12px]">
                    <span className="font-medium text-ink-soft">Main: </span>
                    ৳{balance}
                  </span>
                  <span className="text-[11px] font-bold text-[#FF4D4F] sm:text-[12px]">
                    <span className="font-medium text-ink-soft">Exp: </span>
                    ৳{exposure}
                  </span>
                </>
              )}
            </div>
            <Reload
              className="size-3.5! text-gold"
              buttonClassName="grid size-6 shrink-0 place-items-center rounded-md border border-gold/70 transition-opacity hover:opacity-70 disabled:opacity-40 sm:size-7"
              onClick={refreshAccount}
              label="Refresh balance"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            aria-label="Sign up for an account"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] bg-linear-to-r from-[#95C04A] to-[#A1CD5E] px-3 text-[#1B2A0B] transition-opacity hover:opacity-90"
          >
            <SquarePen className="size-3.5" strokeWidth={2.5} />
            <span className="whitespace-nowrap font-poppins text-[12px] font-semibold leading-none">
              Sign Up
            </span>
          </Link>
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
        </div>
      )}
    </header>
  );
}
