import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useSiteFeatures, { anyLossBack } from "@/hooks/use-site-features";
import PageTitle from "@/components/dashboard/page-title";
import Reload from "@/components/reload";
import { UplineWhatsappButton } from "@/components/upline-agent-card";
import {
  ArrowLeftRight,
  ChartNoAxesColumn,
  ChevronRight,
  Banknote,
  Copy,
  FileClock,
  HandCoins,
  ScrollText,
  Trophy,
  UserCog,
  Users,
  Waypoints,
} from "lucide-react";
import { api } from "@/lib/api";
import { logout, setUser, setWallet } from "@/lib/auth";
import { refreshBalanceFast } from "@/lib/refresh-account";

// Brushed-gold face of the balance cards.
const metal_card = {
  background:
    "linear-gradient(105deg, #B98413 0%, #ECCC77 28%, #F0D27F 48%, #CD9B31 66%, #A97E1B 100%)",
};

const menu_links = [
  { icon: <Waypoints />, name: "P2P Transfer", path: "/dashboard/p2p" },
  {
    icon: <ArrowLeftRight />,
    name: "Transaction",
    path: "/dashboard/transaction",
  },
  { icon: <ScrollText />, name: "Bet History", path: "/dashboard/bet-history" },
  { icon: <Banknote />, name: "Profit/Loss", path: "/dashboard/profit-loss" },
  {
    icon: <ChartNoAxesColumn />,
    name: "Turnover",
    path: "/dashboard/turnover",
  },
  { icon: <HandCoins />, name: "Loss Back", path: "/dashboard/loss-back" },
  { icon: <Users />, name: "Referral", path: "/dashboard/referral" },
  {
    icon: <UserCog />,
    name: "Profile & Settings",
    path: "/dashboard/settings",
  },
  {
    icon: <FileClock />,
    name: "Activity Log",
    path: "/dashboard/activity-log",
  },
];

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user) || {};
  // P2P and Loss Back show only when this site has them switched on.
  const features = useSiteFeatures();
  const visible_links = menu_links.filter(
    (item) =>
      (item.path !== "/dashboard/p2p" || features.p2p) &&
      (item.path !== "/dashboard/loss-back" || anyLossBack(features)),
  );
  const wallet = user.wallet || {};
  const displayName = user.full_name || user.username || "Player";
  const username = user.username || "—";
  const signUpDate = user.created_at
    ? new Date(user.created_at).toISOString().slice(0, 10)
    : "—";
  const mainBalance = Number(
    wallet.available ?? wallet.main_balance ?? wallet.balance ?? 0,
  ).toFixed(2);
  const cashBackBalance = Number(
    wallet.cashback_balance ?? wallet.cash_back_balance ?? 0,
  ).toFixed(2);

  const copyText = (value) =>
    navigator.clipboard.writeText(String(value || ""));
  const refreshBalance = useCallback(async () => {
    try {
      await refreshBalanceFast({
        onWallet: (nextWallet) => dispatch(setWallet(nextWallet)),
        onAccount: (account) => dispatch(setUser(account)),
      });
    } catch {
      // Preserve the last confirmed wallet amount instead of blanking the page.
    }
  }, [dispatch]);
  const signOut = () => {
    // Revoke the token in the background (the request reads it before the
    // session is cleared) so the user leaves instantly.
    api.post("/api/auth/logout", {}).catch(() => {
      /* cleared locally regardless */
    });
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  // The level strip stays hidden until the real VIP status has loaded.
  const [vip, set_vip] = useState(null);
  useEffect(() => {
    let active = true;
    api
      .get("/api/vip/status")
      .then((response) => {
        if (active) set_vip(response.data || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const level_progress = Math.min(100, Number(vip?.progress_pct || 0));

  return (
    <>
      <header className="sticky top-0 z-20 bg-account-header pt-[env(safe-area-inset-top)]">
        <PageTitle
          title="Profile"
          titleClass="font-poppins text-[15px] font-bold tracking-tight"
          className="min-h-[51px]! bg-account-header px-3! text-white [&_svg]:size-7"
          onClick={() => navigate("/")}
        />
      </header>
      <div className="px-2.5 py-2">
        <div className="mb-1 flex items-center justify-between gap-x-2 px-1 py-1.5">
          <div className="flex min-w-0 items-center gap-x-2 py-1 pl-2">
            <div className="flex-none">
              <svg
                className="size-7"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.9988 1.1C10.33 1.6 6.97376 3.425 4.57376 6.21875C1.66751 9.60625 0.398758 14.25 1.18626 18.6062C2.36126 25.125 7.51751 30.0437 14.08 30.9062C15.0488 31.0312 16.9488 31.0312 17.9175 30.9062C23.9363 30.1187 28.8738 25.8375 30.4675 20.0188C30.88 18.5125 30.9675 17.85 30.9675 16C30.9675 14.15 30.88 13.4875 30.4675 11.9812C28.8488 6.09375 23.73 1.725 17.6738 1.06875C16.83 0.975 14.7863 0.99375 13.9988 1.1ZM17.4988 3.13125C22.855 3.725 27.38 7.7625 28.6175 13.0437C29.0488 14.8875 29.0488 17.1125 28.6238 18.9312C28.28 20.3812 27.6113 21.9437 26.8175 23.1188C26.7738 23.1937 26.6363 23.1 26.1738 22.6875C23.8425 20.6125 21.2675 19.375 18.28 18.9C17.3113 18.7437 15.2675 18.7125 14.2488 18.8375C11.03 19.2312 8.31751 20.4688 5.82376 22.6875C5.36126 23.1 5.22376 23.1937 5.18001 23.1188C4.14876 21.5938 3.43001 19.675 3.15501 17.7437C3.03626 16.9 3.03626 15.1 3.15501 14.2625C3.65501 10.7563 5.54876 7.575 8.37376 5.51875C10.9863 3.61875 14.2238 2.76875 17.4988 3.13125Z"
                  fill="var(--c-ink-soft)"
                />
                <path
                  d="M14.75 5.09375C12.5187 5.59375 10.8125 7.2 10.175 9.4125C10.05 9.84375 10.0312 10.0438 10.0312 11C10.0312 11.9563 10.05 12.1563 10.175 12.5875C10.7812 14.675 12.325 16.2188 14.4125 16.825C14.8438 16.95 15.0438 16.9688 16 16.9688C16.9563 16.9688 17.1562 16.95 17.5875 16.825C19.675 16.2188 21.2188 14.675 21.825 12.5875C21.95 12.1563 21.9688 11.9563 21.9688 11C21.9688 10.0438 21.95 9.84375 21.825 9.4125C21.225 7.3375 19.6813 5.7875 17.6188 5.18125C17.0125 5.00625 15.375 4.95625 14.75 5.09375Z"
                  fill="var(--c-ink-soft)"
                />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col gap-y-0.5">
              <h6 className="truncate text-[15px] font-semibold leading-[130%] text-white">
                {displayName}
              </h6>
              <p className="whitespace-nowrap text-[10px] leading-tight text-ink-soft">
                Sign up date : {signUpDate}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyText(displayName)}
              aria-label={`Copy ${displayName} user name`}
              className="ml-1 flex size-9 flex-none items-center justify-center rounded-lg bg-surface"
            >
              <Copy className="size-3.5 -scale-x-100 text-ink-soft" />
            </button>
          </div>

          <div className="w-px h-8 bg-line-strong block"></div>

          <div className="flex items-center gap-x-2 py-1 pr-1">
            <div className="flex flex-col gap-y-0.5">
              <h6 className="text-[10px] leading-tight text-ink-soft">
                Username
              </h6>
              <p className="text-[15px] font-semibold leading-[130%] text-white">
                {username}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyText(username)}
              aria-label={`Copy ${username} user name`}
              className="flex size-9 flex-none items-center justify-center rounded-lg bg-surface"
            >
              <Copy className="size-3.5 -scale-x-100 text-ink-soft" />
            </button>
          </div>
        </div>

        <div className="rounded-md px-3 py-3" style={metal_card}>
          <h6 className="mb-2 font-inter text-[14px] font-semibold leading-tight text-black">
            Main Balance
          </h6>
          <div className="flex items-center justify-between gap-x-3">
            <div className="flex h-8.5 items-center gap-x-1 rounded-full bg-[#111111] px-2.5 [&>svg:first-child]:size-4">
              <span
                aria-hidden="true"
                className="text-base font-bold leading-none text-white"
              >
                ৳
              </span>
              <span className="font-semibold text-white text-sm">
                {mainBalance}
              </span>
              <Reload
                className="text-white ml-2"
                onClick={refreshBalance}
                label="Refresh main balance"
              />
            </div>
            <Link
              to="/dashboard/balance-overview"
              className="flex items-center gap-x-0.5 text-[13px] font-semibold leading-tight text-black"
            >
              Balance Overview <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>

        <section className="mt-2 overflow-hidden rounded-md bg-[#111111]">
          <div className="rounded-md px-3 py-3" style={metal_card}>
            <h6 className="mb-2 font-inter text-[14px] font-semibold leading-tight text-black">
              Cash Back Balance
            </h6>
            <div className="flex items-center justify-between gap-x-3">
              <div className="flex h-8.5 items-center gap-x-1.5 rounded-full bg-[#111111] px-2.5">
                <Trophy className="size-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  {cashBackBalance}
                </span>
                <Reload
                  className="ml-1 text-white"
                  onClick={refreshBalance}
                  label="Refresh cash back balance"
                />
              </div>
              <Link
                to="/dashboard/cashback"
                className="flex items-center gap-x-0.5 text-[13px] font-semibold leading-tight text-black"
              >
                Details <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
          {vip && (
            <Link
              to="/dashboard/vip-club"
              aria-label="Open VIP Club"
              className="block px-3 pb-2.5 pt-3"
            >
              <div className="flex items-center">
                <span className="grid size-9 flex-none place-items-center rounded-lg border-2 border-[#FFD700] bg-[#D4A017] text-white">
                  <Trophy className="size-4.5" />
                </span>
                <span className="h-px flex-1 bg-[#3A3A3A]">
                  <span
                    className="block h-full bg-[#FFD700]"
                    style={{ width: `${level_progress}%` }}
                  />
                </span>
                {vip.next_level && (
                  <span className="grid size-9 flex-none place-items-center rounded-lg border-2 border-[#555555] bg-[#383838] text-ink-dim">
                    <Trophy className="size-4.5" />
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between font-inter text-[10px] font-semibold uppercase leading-none">
                <span className="text-[#EA870F]">{vip.name}</span>
                {vip.next_level && (
                  <span className="text-ink-muted">{vip.next_level.name}</span>
                )}
              </div>
            </Link>
          )}
        </section>

        <nav aria-label="Account" className="mt-2 flex flex-col">
          {visible_links.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex min-h-[37px] items-center gap-x-2.5 rounded-md px-2 text-ink-soft hover:bg-surface [&>svg:first-child]:size-4.5"
            >
              {item.icon}
              <span className="truncate font-inter text-[14px] font-medium">
                {item.name}
              </span>
              <ChevronRight className="ml-auto size-4 flex-none text-ink-muted" />
            </Link>
          ))}
        </nav>

        <UplineWhatsappButton className="mt-4" />

        <div className="mb-4 mt-4 flex flex-col gap-y-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={signOut}
            className="flex h-[42px] items-center justify-center gap-x-2 rounded-md border border-solid border-[#772C2C] bg-surface px-4 text-sm font-medium leading-normal text-[#FF7A84] hover:bg-surface-2"
          >
            <svg
              className="size-4.5"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_172_4729)">
                <path
                  d="M2.37219 0.0471115C1.2593 0.193207 0.318281 1.03539 0.0690619 2.10532C0.00890562 2.35024 0.000311865 3.42445 0.000311865 10.9998C0.000311865 20.5604 -0.0211725 19.8643 0.292499 20.4959C0.507343 20.9385 1.01437 21.4455 1.46125 21.669C2.12297 21.9955 1.81789 21.9784 6.74641 21.9784C10.2011 21.9784 11.1851 21.9655 11.3054 21.9225C11.4816 21.8623 11.705 21.6561 11.8081 21.467C11.8511 21.3811 11.8769 21.2307 11.8812 21.0545C11.8812 20.6893 11.7351 20.4229 11.4386 20.251L11.2366 20.1307L6.85383 20.1092C2.83625 20.0877 2.45812 20.0834 2.33781 20.0147C2.14875 19.9116 1.9468 19.6666 1.89523 19.4776C1.83078 19.2498 1.83078 2.74985 1.89523 2.52211C1.9468 2.33305 2.14875 2.08813 2.33781 1.985C2.45812 1.91625 2.83625 1.91196 6.85383 1.89047L11.2366 1.86899L11.4386 1.74867C11.7351 1.5768 11.8812 1.31039 11.8812 0.94516C11.8769 0.640081 11.8167 0.485394 11.6148 0.28344C11.3441 0.00414276 11.6234 0.0213318 6.91828 0.0170345C4.56789 0.0127373 2.51828 0.0256271 2.37219 0.0471115Z"
                  fill="currentColor"
                />
                <path
                  d="M15.1465 4.67959C15.052 4.72256 14.9273 4.8042 14.8715 4.85576C14.6223 5.09639 14.5406 5.57764 14.691 5.9085C14.7426 6.02881 15.3871 6.69483 16.775 8.06553L18.7816 10.055L13.3762 10.0636L7.9707 10.0765L7.79883 10.171C7.46797 10.3472 7.30469 10.6222 7.30469 11.0003C7.30469 11.3784 7.46797 11.6534 7.79883 11.8296L7.9707 11.9241L13.3762 11.937L18.7816 11.9456L16.775 13.9351C15.3871 15.3058 14.7426 15.9718 14.691 16.0921C14.5406 16.423 14.6223 16.9042 14.8715 17.1448C15.1379 17.3983 15.5891 17.4714 15.9328 17.3167C16.1992 17.1964 21.8367 11.619 21.9313 11.3827C22.0172 11.1679 22.0172 10.8327 21.9313 10.6179C21.8367 10.3815 16.1992 4.8042 15.9328 4.68389C15.7008 4.57647 15.3699 4.57647 15.1465 4.67959Z"
                  fill="currentColor"
                />
              </g>
              <defs>
                <clipPath id="clip0_172_4729">
                  <rect width="22" height="22" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
