import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { api, apiAssetUrl } from "@/lib/api";
import { BankingToast } from "./toast";
import {
  DEPOSIT_PRESETS,
  CURRENCY,
  channelLabel,
  formatAmount,
  toNumber,
} from "./funds";
import {
  AmountField,
  CopyField,
  MethodTile,
  Notice,
  SectionTitle,
  fieldClass,
} from "./ui";

// Deposit against the player's upline agent's Agent Banking numbers:
//   1. pick a payment method (one of the agent's numbers)
//   2. see its number / type / limit and copy the number
//   3. send the money manually, then enter the TrxID + upload the slip
//   4. submit — a pending deposit is created for approval.
const SLIP_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SLIP_BYTES = 5 * 1024 * 1024;

export default function DepositTab({ onSubmitted }) {
  const [methods, setMethods] = useState(null);
  const [reminders, setReminders] = useState("");
  const [remindersOpen, setRemindersOpen] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pickedId, setPickedId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [slip, setSlip] = useState(null); // { dataUrl, name, size }
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const slipRef = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .get("/api/user/agent-banking", { cache: "no-store" })
      .then((response) => {
        if (!active) return;
        setMethods(response.data?.numbers || []);
        setReminders(response.data?.reminders || "");
      })
      .catch((requestError) => {
        if (!active) return;
        setLoadError(requestError.message || "Unable to load payment methods.");
        setMethods([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const list = methods || [];
  const selected = list.find((m) => m.id === pickedId) || list[0] || null;
  const min = toNumber(selected?.min_amount);
  const max = toNumber(selected?.max_amount);

  const amountError = (() => {
    if (!amount) return "";
    const value = Number(amount);
    if (min && value < min)
      return `Minimum deposit is ${CURRENCY}${formatAmount(min)}`;
    if (max && value > max)
      return `Maximum deposit is ${CURRENCY}${formatAmount(max)}`;
    return "";
  })();

  const [flashPreset, setFlashPreset] = useState(null);
  const addPreset = (delta) => {
    setAmount((current) => String(Math.round((Number(current) || 0) + delta)));
    setFlashPreset(delta);
    setTimeout(
      () => setFlashPreset((cur) => (cur === delta ? null : cur)),
      320,
    );
  };

  const pickSlip = (file) => {
    setError("");
    if (!file) return;
    if (!SLIP_ACCEPT.split(",").includes(file.type)) {
      setError("Upload the slip as a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setError("The payment slip must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setSlip({
        dataUrl: String(reader.result || ""),
        name: file.name,
        size: file.size,
      });
    reader.onerror = () =>
      setError("Could not read the image. Try another file.");
    reader.readAsDataURL(file);
  };

  const clearSlip = () => {
    setSlip(null);
    if (slipRef.current) slipRef.current.value = "";
  };

  const trxValid =
    transactionId.trim().length >= 4 && transactionId.trim().length <= 100;
  const canSubmit = selected && !!amount && !amountError && trxValid && !!slip;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!canSubmit) {
      setError(
        amountError || "Fill in every field and attach the payment slip.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post("/api/user/agent-banking/deposit", {
        bank_number_id: selected.id,
        amount: Number(amount),
        transaction_id: transactionId.trim(),
        proof_image: slip.dataUrl,
        notes: notes.trim(),
      });
      setMessage(
        response.message || "Deposit request submitted — pending approval.",
      );
      setAmount("");
      setTransactionId("");
      setNotes("");
      clearSlip();
      onSubmitted?.();
    } catch (requestError) {
      setError(requestError.message || "Could not submit the deposit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (methods === null) {
    return (
      <p className="py-16 text-center text-[13px] text-ink-muted">
        Loading payment methods…
      </p>
    );
  }
  if (!list.length) {
    return (
      <div className="px-2.5 pt-6">
        <Notice tone="info">
          {loadError ||
            "Your agent has not added any deposit methods yet. Please check back later."}
        </Notice>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex min-h-full flex-1 flex-col gap-4 px-2.5 pb-28 pt-3.5"
    >
      <section>
        <SectionTitle>Select Payment</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {list.map((method) => (
            <MethodTile
              key={method.id}
              method={{ code: method.method_name, name: method.method_name }}
              logo={method.logo?.url ? apiAssetUrl(method.logo.url) : ""}
              active={method.id === selected?.id}
              onClick={() => setPickedId(method.id)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <section className="space-y-2.5">
          <SectionTitle
            aside={
              min || max ? (
                <span className="font-poppins text-[11px] text-ink-muted">
                  {CURRENCY}
                  {formatAmount(min)} – {CURRENCY}
                  {formatAmount(max)}
                </span>
              ) : null
            }
          >
            Payment Details
          </SectionTitle>
          <CopyField
            label={`${channelLabel(selected.type)} to this ${selected.method_name} number`}
            value={selected.number}
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-md border border-line bg-surface px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide text-ink-muted">
                Type
              </span>
              <span className="block font-poppins text-[13px] font-semibold text-white">
                {channelLabel(selected.type)}
              </span>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide text-ink-muted">
                Limit
              </span>
              <span className="block font-poppins text-[13px] font-semibold text-white">
                {CURRENCY}
                {formatAmount(min)} – {CURRENCY}
                {formatAmount(max)}
              </span>
            </div>
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Amount</SectionTitle>
        <AmountField
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min={min || undefined}
          max={max || undefined}
        />
        {amountError && (
          <span className="mt-1 block text-[11px] text-[#FF7A84]">
            {amountError}
          </span>
        )}
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {DEPOSIT_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => addPreset(value)}
              className={`h-9 rounded-md border font-poppins text-[11px] font-semibold transition-all duration-200 ${
                flashPreset === value
                  ? "scale-105 border-gold bg-gold text-on-gold shadow-[0_0_12px_rgba(201,162,39,0.55)]"
                  : "border-line bg-surface text-white hover:border-gold"
              }`}
            >
              +{formatAmount(value)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Transaction ID</SectionTitle>
        <input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter the payment transaction ID"
          aria-label="Transaction ID"
          autoComplete="off"
          spellCheck={false}
          className={fieldClass}
        />
      </section>

      <section>
        <SectionTitle>Payment Slip</SectionTitle>
        {slip ? (
          <div className="relative overflow-hidden rounded-md border border-line bg-surface">
            <img
              src={slip.dataUrl}
              alt="Payment slip preview"
              className="max-h-56 w-full object-contain"
            />
            <button
              type="button"
              onClick={clearSlip}
              aria-label="Remove slip"
              className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="size-4" />
            </button>
            <span className="block truncate px-3 py-2 text-[11px] text-ink-muted">
              {slip.name}
            </span>
          </div>
        ) : (
          <label className="flex h-[88px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong bg-surface text-center text-ink-muted">
            <span className="font-poppins text-[13px] font-semibold text-white">
              Upload payment slip
            </span>
            <span className="text-[11px]">JPG, PNG or WEBP — up to 5 MB</span>
            <input
              ref={slipRef}
              type="file"
              accept={SLIP_ACCEPT}
              onChange={(e) => pickSlip(e.target.files?.[0])}
              className="hidden"
            />
          </label>
        )}
      </section>

      {reminders.trim() && (
        <section>
          <div className="overflow-hidden rounded-md border border-line bg-surface/60">
            <button
              type="button"
              onClick={() => setRemindersOpen((open) => !open)}
              aria-expanded={remindersOpen}
              className="flex w-full items-center justify-between px-3 py-3 text-left"
            >
              <span className="font-poppins text-[13px] font-semibold text-white">Gentle Reminders</span>
              <ChevronDown className={`size-5 text-ink-muted transition-transform ${remindersOpen ? "rotate-180" : ""}`} />
            </button>
            {remindersOpen && (
              <div
                className="border-t border-line px-3 py-3 text-[12px] leading-relaxed text-white [&_a]:text-gold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: reminders }}
              />
            )}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 z-10 -mx-2.5 mt-auto space-y-2 bg-page px-2.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5">
        {(error || message) && (
          <BankingToast
            toast={{ message: error || message, type: error ? "error" : "success", id: error ? "err" : "ok" }}
            onClose={() => { setError(""); setMessage(""); }}
          />
        )}
        <button
          disabled={submitting || !canSubmit}
          className="h-11 w-full rounded-md bg-gold font-poppins text-[14px] font-bold text-on-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "SUBMIT"}
        </button>
      </div>
    </form>
  );
}
