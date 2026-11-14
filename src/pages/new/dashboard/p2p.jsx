import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Check, Copy, X } from "lucide-react";
import { api } from "@/lib/api";
import useSiteFeatures from "@/hooks/use-site-features";
import { setUser } from "@/lib/auth";

const fieldClass =
  "h-[42px] w-full rounded-md border border-line bg-surface px-3 font-poppins text-[13px] font-medium text-white outline-none transition-colors focus:border-gold";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

function CurrencyBadge() {
  return (
    <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-white text-[12px] font-semibold leading-none text-white">
      ৳
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

export default function Banking() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  // P2P is the only option here, and it shows only when this site has it switched on.
  const features = useSiteFeatures();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [p2p, setP2p] = useState({ recipient: "", amount: "", note: "" });

  const [usernameCopied, setUsernameCopied] = useState(false);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the request resolves
    loadP2pConfig();
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

  const limits = p2pConfig?.limits;
  const today = p2pConfig?.today;
  const p2pAllowed = p2pConfig ? p2pConfig.allowed !== false : true;
  const hasValue = (value) => value !== null && value !== undefined;
  const dailyCountReached =
    hasValue(today?.remaining_count) && today.remaining_count <= 0;
  const username = String(user?.username || "");

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
      await refreshUser();
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
      <header className="sticky top-0 z-30 bg-account-header">
        <div className="relative flex h-[49px] items-center justify-center px-4">
          <h1 className="font-poppins text-[16px] font-bold leading-7 text-white">
            P2P Transfer
          </h1>
          <button
            type="button"
            aria-label="Close P2P transfer"
            onClick={() => navigate("/profile")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
          >
            <X className="size-7" />
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {!features.p2p && (
          <p className="px-4 pt-10 text-center text-[13px] text-ink-muted">
            P2P transfer is not available on this site.
          </p>
        )}

        {features.p2p && (
          <form
            onSubmit={submitP2p}
            className="flex min-h-full flex-1 flex-col gap-4 px-2.5 pt-3.5"
          >
            <section>
              <SectionTitle>My Username</SectionTitle>
              <div className="flex items-stretch gap-2">
                <span className="flex h-[40px] min-w-0 flex-1 items-center rounded-md border border-line bg-surface px-2.5 font-poppins text-[11px] font-medium text-ink-muted">
                  <span className="truncate">{username || "—"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(username);
                    setUsernameCopied(true);
                    setTimeout(() => setUsernameCopied(false), 1500);
                  }}
                  aria-label={usernameCopied ? "Username copied" : "Copy username"}
                  className="grid h-[40px] w-11 flex-none place-items-center rounded-md bg-gold text-white"
                >
                  {usernameCopied ? (
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
                  placeholder="Recipient Username"
                  aria-label="Recipient Username"
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
