import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronsDown,
  Copy,
  Gift,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { setUser } from "@/lib/auth";
import { DISPLAY_CURRENCY } from "@/lib/currency";

const CURRENCY_CODE = DISPLAY_CURRENCY;
const QUICK_AMOUNTS = [500, 1000, 1500, 3000, 5000, 10000, 15000, 25000, 200, 100, 50, 10];
const TABS = ["Deposit", "Withdraw", "P2P"];

// Shown until the site's own payment methods have loaded (the server's default limits).
const FALLBACK_METHODS = ["Rocket", "upay", "Nagad", "bKash"].map((name) => ({
  code: name.toLowerCase(),
  name,
  deposit_min_amount: 100,
  deposit_max_amount: 30000,
  withdrawal_min_amount: 300,
  withdrawal_max_amount: 25000,
}));
const METHOD_COLORS = {
  rocket: "#8C1D82",
  upay: "#F2B705",
  nagad: "#F7801E",
  bkash: "#E2136E",
};

const fieldClass =
  "h-[42px] w-full rounded-md border border-line bg-surface px-3 font-poppins text-[13px] font-medium text-white outline-none transition-colors focus:border-gold";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function CurrencyBadge() {
  return (
    <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-white text-[12px] font-semibold leading-none text-white">
      $
    </span>
  );
}

function CheckDot() {
  return (
    <span className="grid size-[18px] flex-none place-items-center rounded-full bg-gold text-white">
      <Check className="size-3" strokeWidth={3.5} />
    </span>
  );
}

function SectionTitle({ children, aside }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-1 rounded-full bg-gold" />
        <h3 className="font-poppins text-[13px] font-semibold leading-5 text-white">
          {children}
        </h3>
      </div>
      {aside}
    </div>
  );
}

function Reminder({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
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

function MethodLogo({ method }) {
  return (
    <span
      className="grid size-[30px] place-items-center rounded-[3px] font-poppins text-[15px] font-bold text-white"
      style={{ backgroundColor: METHOD_COLORS[method.code] || "var(--c-gold-dark)" }}
    >
      {String(method.name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// Layout only for now: online deposits and withdrawals are not open yet, so
// nothing on these two tabs talks to the payment endpoints.
function FundsForm({ flow, methods, network_title, children }) {
  const is_deposit = flow === "deposit";
  const [selected_code, set_selected_code] = useState(null);
  const [amount, set_amount] = useState("");
  const selected =
    methods.find((method) => method.code === selected_code) || methods[0];
  const minimum = selected?.[`${flow}_min_amount`] ?? 0;
  const maximum = selected?.[`${flow}_max_amount`] ?? 0;

  return (
    <>
      <section>
        <SectionTitle>Select Payment</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((method) => {
            const active = method.code === selected?.code;
            return (
              <button
                key={method.code}
                type="button"
                aria-pressed={active}
                onClick={() => set_selected_code(method.code)}
                className={`relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-md border bg-surface text-[11.5px] font-medium text-white ${active ? "border-gold" : "border-transparent"}`}
              >
                {active && (
                  <span className="absolute left-1.5 top-1.5">
                    <CheckDot />
                  </span>
                )}
                <MethodLogo method={method} />
                {method.name}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        {network_title && <SectionTitle>{network_title}</SectionTitle>}
        <div className="inline-flex h-[38px] items-center gap-2 rounded-md border border-gold bg-surface px-3.5 font-poppins text-[13px] font-medium text-white">
          <CheckDot />
          AGENT-PAY
        </div>
      </section>

      <section>
        <SectionTitle
          aside={
            <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <Info className="size-4" />
              $ {Number(minimum).toFixed(2)} - $ {Number(maximum).toFixed(2)}
            </span>
          }
        >
          Amount
        </SectionTitle>
        <label className="flex h-[38px] items-center rounded-md border border-line bg-surface focus-within:border-gold">
          <span className="flex h-5 items-center border-r border-line px-2">
            <CurrencyBadge />
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={amount}
            onChange={(event) => set_amount(event.target.value)}
            placeholder="0"
            aria-label="Amount"
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-right text-[13px] font-semibold text-white outline-none placeholder:text-ink-muted"
          />
        </label>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => set_amount(String(Number(amount || 0) + value))}
              className="h-[34px] rounded-[4px] border border-line bg-surface text-[11.5px] font-medium text-white hover:border-gold"
            >
              +{value}
            </button>
          ))}
        </div>
      </section>

      {children}

      <div className="flex flex-col gap-2 pb-5">
        <button
          type="button"
          disabled
          className="h-10 rounded-md bg-gold text-[13px] font-semibold text-on-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>
        <p className="text-center text-xs text-ink-muted">
          {is_deposit ? "Deposits" : "Withdrawals"} are handled by your agent.{" "}
          <Link to="/upline-whatsapp" className="font-semibold text-gold">
            Contact your agent
          </Link>
        </p>
      </div>
    </>
  );
}

export default function Banking() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [active_tab, set_active_tab] = useState("P2P");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [p2p, setP2p] = useState({ recipient: "", amount: "", note: "" });
  const [walletIdCopied, setWalletIdCopied] = useState(false);
  const [p2pConfig, setP2pConfig] = useState(null);
  const [wallet_number, set_wallet_number] = useState("");

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

  const fetchFunds = async () => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the requests resolve
    fetchFunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first load only
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
    setLoading(true);
    await refreshUser();
    await fetchFunds();
  };

  const methods_for = (flag) => {
    const methods = (config?.payment_methods || []).filter((method) => method[flag]);
    return methods.length ? methods : FALLBACK_METHODS;
  };

  const limits = p2pConfig?.limits;
  const today = p2pConfig?.today;
  const p2pAllowed = p2pConfig ? p2pConfig.allowed !== false : true;
  const hasValue = (value) => value !== null && value !== undefined;
  const dailyCountReached =
    hasValue(today?.remaining_count) && today.remaining_count <= 0;
  const wallet_id = String(user?.id || user?.username || "");

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

  const update_p2p = (name) => (event) =>
    setP2p((current) => ({ ...current, [name]: event.target.value }));

  return (
    <div className="banking-page flex min-h-dvh flex-col bg-page text-white">
      <header className="sticky top-0 z-30 bg-gold">
        <div className="relative flex h-[49px] items-center justify-center px-4">
          <h1 className="font-poppins text-[16px] font-bold leading-7 text-white">
            Banking
          </h1>
          <button
            type="button"
            aria-label="Close banking"
            onClick={() => navigate("/profile")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
          >
            <X className="size-7" />
          </button>
        </div>
        <div role="tablist" aria-label="Banking" className="grid grid-cols-3">
          {TABS.map((tab) => {
            const active = tab === active_tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => set_active_tab(tab)}
                className={`h-[37px] border-b-2 font-poppins text-[13px] font-semibold ${active ? "border-white text-white" : "border-transparent text-white/55"}`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {active_tab === "Deposit" && (
          <div className="flex flex-col gap-4 px-2 pt-3.5">
            <div className="flex h-[32px] items-center justify-between rounded-md border border-gold/70 bg-surface px-3 text-white">
              <span className="flex items-center gap-1.5 text-[11.5px] font-medium">
                <Gift className="size-4" />
                <span className="grid size-3.5 place-items-center rounded-[2px] bg-[#2EAF5D]">
                  <Check className="size-2.5" strokeWidth={4} />
                </span>
                NO BONUS
                <span className="grid size-3.5 place-items-center rounded-[2px] bg-[#2EAF5D]">
                  <Check className="size-2.5" strokeWidth={4} />
                </span>
                NO TO
              </span>
              <ChevronDown className="size-4 text-ink-muted" />
            </div>
            <FundsForm
              flow="deposit"
              methods={methods_for("deposit_enabled")}
              network_title="Choose Network"
            >
              <Reminder>
                Deposits are handled by your agent. Contact your agent to add
                balance to your account.
              </Reminder>
            </FundsForm>
          </div>
        )}

        {active_tab === "Withdraw" && (
          <div className="flex flex-col gap-4 px-2 pt-3.5">
            <div className="flex items-center rounded-md border border-line bg-surface">
              <div className="min-w-0 flex-1 px-4 py-3.5">
                <p className="font-poppins text-[17px] font-semibold leading-tight text-white">
                  Withdrawable Amount
                </p>
                <strong className="mt-1 block truncate font-poppins text-[15px] font-medium text-white">
                  {CURRENCY_CODE}{" "}
                  {Number(config?.wallet?.available || 0).toFixed(2)}
                </strong>
              </div>
              <button
                type="button"
                aria-label="Refresh balance"
                onClick={refreshFunds}
                disabled={loading}
                className="my-3 grid w-[58px] flex-none place-items-center self-stretch border-l border-line-strong text-white disabled:opacity-50"
              >
                <RefreshCw className={`size-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <FundsForm flow="withdrawal" methods={methods_for("withdrawal_enabled")}>
              <section>
                <SectionTitle>Your Wallet Number</SectionTitle>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={wallet_number}
                  onChange={(event) =>
                    set_wallet_number(event.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="0"
                  aria-label="Your wallet number"
                  className={`${fieldClass} placeholder:text-ink-muted`}
                />
              </section>
            </FundsForm>
          </div>
        )}

        {active_tab === "P2P" && (
          <form
            onSubmit={submitP2p}
            className="flex min-h-full flex-1 flex-col gap-4 px-2.5 pt-3.5"
          >
            <section>
              <SectionTitle>My Wallet ID</SectionTitle>
              <div className="flex items-stretch gap-2">
                <span className="flex h-[40px] min-w-0 flex-1 items-center rounded-md border border-line bg-surface px-2.5 font-poppins text-[11px] font-medium text-ink-muted">
                  <span className="truncate">{wallet_id || "—"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(wallet_id);
                    setWalletIdCopied(true);
                    setTimeout(() => setWalletIdCopied(false), 1500);
                  }}
                  aria-label={walletIdCopied ? "Wallet ID copied" : "Copy wallet ID"}
                  className="grid h-[40px] w-11 flex-none place-items-center rounded-md bg-gold text-white"
                >
                  {walletIdCopied ? (
                    <Check className="size-4.5" />
                  ) : (
                    <Copy className="size-4.5 -scale-x-100" />
                  )}
                </button>
              </div>
            </section>

            <section>
              <SectionTitle>Transfer To</SectionTitle>
              <div className="flex flex-col gap-3.5">
                <input
                  required
                  value={p2p.recipient}
                  onChange={update_p2p("recipient")}
                  placeholder="Recipient Wallet ID"
                  aria-label="Recipient Wallet ID"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`${fieldClass} placeholder:text-white`}
                />
                <div>
                  <label className="flex h-[42px] items-center rounded-md border border-line bg-surface focus-within:border-gold">
                    <span className="flex h-5 items-center border-r border-line-strong px-2">
                      <CurrencyBadge />
                    </span>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="0.01"
                      value={p2p.amount}
                      onChange={update_p2p("amount")}
                      placeholder="Transfer Amount"
                      aria-label="Transfer Amount"
                      className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 font-poppins text-[13px] font-medium text-white outline-none placeholder:text-white"
                    />
                  </label>
                  {amountError && (
                    <span className="mt-1 block text-[11px] text-[#FF7A84]">
                      {amountError}
                    </span>
                  )}
                </div>
                <input
                  value={p2p.note}
                  onChange={update_p2p("note")}
                  placeholder="Remark"
                  aria-label="Remark"
                  className={`${fieldClass} placeholder:text-white`}
                />
              </div>
            </section>

            <div className="min-h-2 flex-1" />
            <div className="sticky bottom-0 z-10 -mx-2.5 bg-page px-2.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5">
              {!p2pAllowed && (
                <div className="mb-2 rounded-md border border-[#772C2C] bg-[#C52B2B]/10 px-3 py-2.5 text-xs text-[#FF7A84]">
                  P2P transfer is currently disabled for your account.
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
                  className="h-10 rounded-md border border-line-strong bg-transparent text-[13px] font-semibold text-white hover:border-gold"
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
                  className="h-10 rounded-md bg-gold text-[13px] font-semibold text-on-gold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Transferring…" : "Submit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
