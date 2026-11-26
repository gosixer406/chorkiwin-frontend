import { useEffect, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { brandFor } from './funds'

// Small presentational pieces shared by the Deposit / Withdraw / P2P tabs.

export const fieldClass =
  'h-[46px] w-full rounded-md border border-line bg-surface px-3 font-poppins text-[13px] font-medium text-white outline-none transition-colors focus:border-gold placeholder:text-ink-muted'

export function CurrencyBadge() {
  return (
    <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-white text-[12px] font-semibold leading-none text-white">
      ৳
    </span>
  )
}

export function SectionTitle({ children, aside }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-1 rounded-full bg-gold" />
        <h3 className="font-poppins text-[13px] font-semibold leading-5 text-white">{children}</h3>
      </div>
      {aside}
    </div>
  )
}

/** Colored error / success / info banner with an optional dismiss button. */
export function Notice({ tone = 'error', children, onDismiss }) {
  const tones = {
    error: 'border-[#772C2C] bg-[#C52B2B]/10 text-[#FF7A84]',
    success: 'border-[#16833B]/50 bg-[#16833B]/15 text-[#5BD69E]',
    info: 'border-line-strong bg-surface text-ink-soft',
  }
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex min-h-9 items-start justify-between gap-2 rounded-md border px-3 py-2.5 text-xs leading-relaxed ${tones[tone]}`}
    >
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-70"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/**
 * Payment-method tile. Shows the method's real logo when `logo` is given,
 * otherwise a brand-tinted letter badge (bKash / Nagad / Rocket / Upay …).
 */
export function MethodTile({ method, active, onClick, logo }) {
  const brand = brandFor(method.code)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-md border bg-surface transition-colors ${
        active ? 'border-gold' : 'border-line hover:border-line-strong'
      }`}
    >
      {active && (
        <span className="absolute left-1.5 top-1.5 z-10 grid size-4 place-items-center rounded-full bg-gold text-on-gold">
          <Check className="size-3" />
        </span>
      )}
      {logo ? (
        <img
          src={logo}
          alt={method.name || ''}
          className="size-10 rounded  object-contain"
        />
      ) : (
        <span
          className="grid size-8 place-items-center rounded-md text-[13px] font-bold uppercase"
          style={{ backgroundColor: brand.bg, color: brand.fg }}
        >
          {String(method.name || method.code || '?').slice(0, 1)}
        </span>
      )}
      <span className="max-w-full truncate px-1 font-poppins text-[11px] font-medium text-white">
        {method.name}
      </span>
    </button>
  )
}

/** Currency-prefixed amount field; pulses gold whenever the amount changes. */
export function AmountField({ value, onChange, placeholder = 'Enter amount', min, max }) {
  const [bump, setBump] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return undefined
    }
    if (value === '' || value == null) return undefined
    // eslint-disable-next-line react-hooks/set-state-in-effect -- brief one-shot pulse when the amount changes
    setBump(true)
    const timer = setTimeout(() => setBump(false), 280)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <label
      className={`flex h-[46px] items-center rounded-md border bg-surface transition-all duration-200 focus-within:border-gold ${
        bump ? 'scale-[1.02] border-gold ring-2 ring-gold/40' : 'border-line'
      }`}
    >
      <span className="flex h-5 items-center border-r border-line-strong px-2.5">
        <CurrencyBadge />
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="0.01"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`h-full min-w-0 flex-1 border-0 bg-transparent px-3 font-poppins text-[14px] font-semibold outline-none transition-colors duration-200 placeholder:text-ink-muted ${
          bump ? 'text-gold-light' : 'text-white'
        }`}
      />
    </label>
  )
}

/** Read-only value with a copy button that flashes green when copied. */
export function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!value) return
    navigator.clipboard?.writeText(String(value))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 py-2 text-left transition-colors duration-200 ${
        copied ? 'border-emerald-500/70' : 'border-line'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-ink-muted">{label}</span>
        <span className="block truncate font-mono text-[15px] font-bold tracking-wide text-gold-light">
          {value || '—'}
        </span>
      </span>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-200 ${
          copied ? 'scale-105 bg-emerald-500 text-white' : 'bg-white/5 text-ink-muted'
        }`}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}
