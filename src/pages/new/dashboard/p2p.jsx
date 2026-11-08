import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronsDown,
  Copy,
  RefreshCw,
  SendHorizontal,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { setUser } from "@/lib/auth";
import { DISPLAY_CURRENCY } from "@/lib/currency";

const CURRENCY_CODE = DISPLAY_CURRENCY;

const fieldClass =
  "h-[38px] w-full rounded-md border border-line bg-page px-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold";

function CurrencyBadge() {
  return (
    <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-gold text-[13px] font-semibold leading-none text-gold">
      $
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-3.5 w-1 rounded-[1px] bg-ink" />
        <h3 className="font-poppins text-[13px] font-bold leading-5 tracking-wide text-gold">
          {children}
        </h3>
      </div>
    </div>
  );
}

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function LimitTile({ label, value, warn = false }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-line bg-surface px-3 py-2">
      <span className="font-poppins text-[10.5px] font-medium text-ink-muted">
        {label}
      </span>
      <strong
        className={`truncate font-poppins text-[13px] font-semibold ${warn ? "text-[#FF7A84]" : "text-ink"}`}
      >
        {value}
      </strong>
    </div>
  );
}

function Reminder({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface transition-all duration-300">
      <button
        type="button"
        aria-label="Gentle Reminders"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-[38px] w-full items-center justify-between px-2 text-white"
      >
        <span className="text-[11px] font-semibold tracking-tight">
          Gentle Reminders
        </span>
        <ChevronsDown
          className={`size-4 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-line px-3 py-2.5 text-xs leading-5 text-ink-muted">
          {children}
        </div>
      )}
    </div>
  );
}

export default function P2p() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [p2p, setP2p] = useState({ recipient: "", amount: "", note: "" });
  const [walletIdCopied, setWalletIdCopied] = useState(false);
  const [p2pConfig, setP2pConfig] = useState(null);

  const loadP2pConfig = async () => {
    try {
      const response = await api.get("/api/wallet/p2p/config", {
        cache: "no-store",
      });
      setP2pConfig(response.data);
    } catch {
      setP2pConfig(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [fundsResponse] = await Promise.all([
        api.get("/api/wallet/funds-config"),
        loadP2pConfig(),
      ]);
      setConfig(fundsResponse.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    document.body.classList.add("dark-banking-backdrop");
    return () => document.body.classList.remove("dark-banking-backdrop");
  }, []);

  const refreshUser = async () => {
    const response = await api.get("/api/auth/me");
    dispatch(setUser(response.data));
    window.dispatchEvent(new CustomEvent("velki:balance-changed"));
  };

  const refreshFunds = async () => {
    await refreshUser();
    await load();
  };

  const limits = p2pConfig?.limits;
  const today = p2pConfig?.today;
  const p2pAllowed = p2pConfig ? p2pConfig.allowed !== false : true;
  const hasValue = (value) => value !== null && value !== undefined;
  const dailyCountReached =
    hasValue(today?.remaining_count) && today.remaining_count <= 0;

  // Mirrors the server rules so the player sees the problem before sending.
  const limitError = (value) => {
    if (!limits) return "";
    const amount = Number(value);
    if (!amount) return "";
    if (amount < limits.min_amount)
      return `Minimum P2P transfer is ${formatAmount(limits.min_amount)}`;
    if (limits.max_per_transfer > 0 && amount > limits.max_per_transfer)
      return `Maximum per transfer is ${formatAmount(limits.max_per_transfer)}`;
    if (dailyCountReached)
      return `Daily limit reached: ${limits.daily_count_limit} transfers per day`;
    if (hasValue(today?.remaining_amount) && amount > today.remaining_amount)
      return `You can send ${formatAmount(today.remaining_amount)} more today`;
    return "";
  };
  const amountError = limitError(p2p.amount);

  const submitP2p = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (amountError) {
      setError(amountError);
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post("/api/wallet/p2p", p2p);
      setMessage(
        `${response.message}. Reference: ${response.data.reference_id}`,
      );
      setP2p({ recipient: "", amount: "", note: "" });
      if (response.data?.today)
        setP2pConfig((current) =>
          current ? { ...current, today: response.data.today } : current,
        );
      // Show the new balance at once from the transfer response, then
      // refetch the wallet so the page matches the server.
      if (response.data?.balance !== undefined)
        setConfig((current) =>
          current
            ? {
                ...current,
                wallet: { ...current.wallet, available: response.data.balance },
              }
            : current,
        );
      await Promise.all([
        refreshUser(),
        api
          .get("/api/wallet/funds-config", { cache: "no-store" })
          .then((fundsResponse) => setConfig(fundsResponse.data))
          .catch(() => {}),
      ]);
    } catch (requestError) {
      setError(requestError.message);
      loadP2pConfig();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page text-white">
      <header className="sticky top-0 z-30 border-b border-line bg-bar">
        <div className="relative flex h-[51px] items-center justify-center px-4">
          <h1 className="font-poppins text-[15px] font-bold leading-7 tracking-tight text-ink">
            P2P Transfer
          </h1>
          <button
            type="button"
            aria-label="Close P2P transfer"
            onClick={() => navigate("/profile")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
          >
            <X className="size-6" />
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 overflow-y-auto">
        <form
          onSubmit={submitP2p}
          className="flex min-h-full w-full flex-1 flex-col gap-4 px-[13px] pt-3.5"
        >
          <div className="flex items-center overflow-hidden rounded-md bg-linear-to-r from-(--menu-banner-from) via-(--menu-banner-via) to-(--menu-banner-to)">
            <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5">
              <span className="font-poppins text-xs text-(--menu-banner-sub)">
                Available Balance
              </span>
              <strong className="truncate font-poppins text-xl font-bold leading-tight text-white">
                {CURRENCY_CODE}{" "}
                {Number(config?.wallet?.available || 0).toFixed(2)}
              </strong>
            </div>
            <button
              type="button"
              aria-label="Refresh balance"
              onClick={refreshFunds}
              disabled={loading}
              className="mr-3 grid size-9 shrink-0 place-items-center rounded-full bg-[#1E1606]/40 text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <section>
            <SectionTitle>My Username</SectionTitle>
            <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
              <span className="grid size-7.5 shrink-0 place-items-center rounded-[5px] bg-linear-to-b from-gold-light to-gold-dark text-on-gold">
                <Wallet className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1 truncate font-poppins text-[13px] font-semibold tracking-wide text-ink">
                {user?.username || "—"}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(String(user?.username || ""));
                  setWalletIdCopied(true);
                  setTimeout(() => setWalletIdCopied(false), 1500);
                }}
                aria-label="Copy username"
                className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${walletIdCopied ? "border-gold text-gold" : "border-line bg-page text-ink-soft hover:border-gold"}`}
              >
                {walletIdCopied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5 -scale-x-100" />
                )}
                {walletIdCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          {limits && (
            <section>
              <SectionTitle>Transfer Limits</SectionTitle>
              {!p2pAllowed ? (
                <div className="rounded-md border border-[#772C2C] bg-[#C52B2B]/10 px-3 py-2.5 text-xs text-[#FF7A84]">
                  P2P transfer is currently disabled for your account.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <LimitTile
                    label="Per Transfer"
                    value={`${formatAmount(limits.min_amount)} – ${limits.max_per_transfer > 0 ? formatAmount(limits.max_per_transfer) : "No limit"}`}
                  />
                  <LimitTile
                    label="Transfers Today"
                    value={
                      limits.daily_count_limit > 0
                        ? `${today?.count ?? 0} / ${limits.daily_count_limit}`
                        : `${today?.count ?? 0}`
                    }
                    warn={dailyCountReached}
                  />
                  <LimitTile
                    label="Sent Today"
                    value={
                      limits.daily_amount_limit > 0
                        ? `${formatAmount(today?.amount)} / ${formatAmount(limits.daily_amount_limit)}`
                        : formatAmount(today?.amount)
                    }
                  />
                  <LimitTile
                    label="Left Today"
                    value={
                      hasValue(today?.remaining_amount)
                        ? formatAmount(today.remaining_amount)
                        : "No limit"
                    }
                    warn={today?.remaining_amount === 0}
                  />
                </div>
              )}
            </section>
          )}

          <section>
            <SectionTitle>Transfer To</SectionTitle>
            <div className="flex flex-col gap-3 rounded-md border border-line bg-surface px-3 py-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="font-poppins text-[11px] font-medium text-ink-muted">
                  Recipient Username
                </span>
                <span className="flex h-[42px] items-center rounded-md border border-line bg-page focus-within:border-gold">
                  <UserRound className="ml-3 size-4 shrink-0 text-gold" />
                  <input
                    required
                    value={p2p.recipient}
                    onChange={(event) =>
                      setP2p((current) => ({
                        ...current,
                        recipient: event.target.value,
                      }))
                    }
                    placeholder="Enter recipient username"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-muted"
                  />
                </span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-poppins text-[11px] font-medium text-ink-muted">
                  Amount
                </span>
                <span className="flex h-[42px] items-center rounded-md border border-line bg-page focus-within:border-gold">
                  <span className="flex h-5 items-center border-r border-line px-2.5">
                    <CurrencyBadge />
                  </span>
                  <input
                    required
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    value={p2p.amount}
                    onChange={(event) =>
                      setP2p((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-2.5 text-right text-[13px] text-ink outline-none placeholder:text-ink-muted"
                  />
                </span>
                {amountError && (
                  <span className="text-[11px] text-[#FF7A84]">
                    {amountError}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-poppins text-[11px] font-medium text-ink-muted">
                  Remark <span className="text-ink-dim">(optional)</span>
                </span>
                <input
                  value={p2p.note}
                  onChange={(event) =>
                    setP2p((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Add a note"
                  className={`${fieldClass} h-[42px]! px-3`}
                />
              </label>
            </div>
          </section>

          <Reminder>
            Transfers move balance instantly to another player&apos;s wallet.
            You can only send to players under your own agent.
            {limits?.daily_count_limit > 0 &&
              ` Up to ${limits.daily_count_limit} transfers per day.`}
            {limits?.daily_amount_limit > 0 &&
              ` Maximum ${CURRENCY_CODE} ${formatAmount(limits.daily_amount_limit)} per day.`}{" "}
            Daily limits reset at 12:00 AM (Bangladesh time). Double-check the
            recipient username before submitting.
          </Reminder>

          <div className="min-h-2 flex-1" />
          <div className="sticky bottom-0 z-10 -mx-[13px] border-t border-line bg-bar px-[13px] pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5">
            {loading && (
              <div className="mb-2 text-center text-xs text-ink-muted">
                Loading…
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="mb-2 flex min-h-9 items-center justify-between gap-2 rounded-md border border-[#772C2C] bg-[#C52B2B]/10 px-3 py-2.5 text-xs text-[#FF7A84]"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                  className="shrink-0 text-[#FF7A84]/70"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
            {message && (
              <div
                role="status"
                className="mb-2 rounded-md border border-[#16833B]/50 bg-[#16833B]/15 px-3 py-2.5 text-xs text-[#5BD69E]"
              >
                {message}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-10 rounded-md border border-line bg-page text-[13px] font-semibold text-ink-soft hover:border-gold"
              >
                Cancel
              </button>
              <button
                disabled={
                  submitting ||
                  !p2pAllowed ||
                  !p2p.recipient.trim() ||
                  !p2p.amount ||
                  !!amountError
                }
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-linear-to-b from-gold-light to-gold-dark text-[13px] font-semibold text-on-gold disabled:opacity-50"
              >
                <SendHorizontal className="size-4" />
                {submitting ? "Transferring…" : "Transfer"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
