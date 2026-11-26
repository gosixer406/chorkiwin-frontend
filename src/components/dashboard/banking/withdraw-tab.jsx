import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api, apiAssetUrl } from '@/lib/api'
import { BankingToast } from './toast'
import { WITHDRAW_PRESETS, CURRENCY, channelLabel, formatAmount, toNumber } from './funds'
import { AmountField, MethodTile, Notice, SectionTitle, fieldClass } from './ui'

// Withdraw through the player's upline agent's Agent Banking methods: pick a
// method, enter your own receiving number and the amount, then submit. A pending
// withdrawal is routed to the agent, who approves it (player → agent transfer).
export default function WithdrawTab({ config, onSubmitted }) {
  const [methods, setMethods] = useState(null)
  const [reminders, setReminders] = useState('')
  const [remindersOpen, setRemindersOpen] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pickedId, setPickedId] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/user/agent-banking', { cache: 'no-store' })
      .then((response) => {
        if (!active) return
        setMethods(response.data?.numbers || [])
        setReminders(response.data?.reminders_withdraw || '')
      })
      .catch((requestError) => {
        if (!active) return
        setLoadError(requestError.message || 'Unable to load withdrawal methods.')
        setMethods([])
      })
    return () => { active = false }
  }, [])

  const available = toNumber(config?.wallet?.available)
  const withdrawLocked = !!config?.account_locks?.withdraw_locked
  const pendingWithdrawals = toNumber(config?.pending?.withdrawals)

  const list = methods || []
  const selected = list.find((m) => m.id === pickedId) || list[0] || null
  const min = toNumber(selected?.min_amount)
  const max = toNumber(selected?.max_amount)

  const amountError = (() => {
    if (!amount) return ''
    const value = Number(amount)
    if (min && value < min) return `Minimum withdrawal is ${CURRENCY}${formatAmount(min)}`
    if (max && value > max) return `Maximum withdrawal is ${CURRENCY}${formatAmount(max)}`
    if (value > available) return `You can withdraw up to ${CURRENCY}${formatAmount(available)}`
    return ''
  })()

  const blocked = withdrawLocked || pendingWithdrawals >= 1
  const canSubmit = !blocked && selected && !!amount && !amountError && !!recipient.trim()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!canSubmit) {
      setError(amountError || 'Fill in every field before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const response = await api.post('/api/user/agent-banking/withdraw', {
        bank_number_id: selected.id,
        amount: Number(amount),
        account_number: recipient.trim(),
      })
      setMessage(response.message || 'Withdrawal request submitted — pending approval.')
      setAmount('')
      setRecipient('')
      onSubmitted?.()
    } catch (requestError) {
      setError(requestError.message || 'Could not submit the withdrawal request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (methods === null) {
    return <p className="py-16 text-center text-[13px] text-ink-muted">Loading withdrawal methods…</p>
  }
  if (!list.length) {
    return (
      <div className="px-2.5 pt-6">
        <Notice tone="info">
          {loadError || 'Your agent has not added any withdrawal methods yet. Please check back later.'}
        </Notice>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex min-h-full flex-1 flex-col gap-4 px-2.5 pb-28 pt-3.5">
      <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2.5">
        <span className="font-poppins text-[12px] text-ink-muted">Available Balance</span>
        <span className="font-poppins text-[15px] font-bold text-gold-light">{CURRENCY}{formatAmount(available)}</span>
      </div>

       {withdrawLocked && <Notice>Withdrawals are locked on your account — contact support.</Notice>}
      {pendingWithdrawals >= 1 && (
        <Notice tone="info">You already have a pending withdrawal. Complete or cancel it before creating another.</Notice>
      )}

      <section>
        <SectionTitle>Select Payment</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {list.map((method) => (
            <MethodTile
              key={method.id}
              method={{ code: method.method_name, name: method.method_name }}
              logo={method.logo?.url ? apiAssetUrl(method.logo.url) : ''}
              active={method.id === selected?.id}
              onClick={() => setPickedId(method.id)}
            />
          ))}
        </div>
      </section>

      {selected && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wide text-ink-muted">Type</span>
            <span className="block font-poppins text-[13px] font-semibold text-white">{channelLabel(selected.type)}</span>
          </div>
          <div className="rounded-md border border-line bg-surface px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wide text-ink-muted">Limit</span>
            <span className="block font-poppins text-[13px] font-semibold text-white">{CURRENCY}{formatAmount(min)} – {CURRENCY}{formatAmount(max)}</span>
          </div>
        </div>
      )}

      <section>
        <SectionTitle
          aside={
            min || max ? (
              <span className="font-poppins text-[11px] text-ink-muted">{CURRENCY}{formatAmount(min)} – {CURRENCY}{formatAmount(max)}</span>
            ) : null
          }
        >
          Amount
        </SectionTitle>
        <AmountField value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" min={min || undefined} max={max || undefined} />
        {amountError && <span className="mt-1 block text-[11px] text-[#FF7A84]">{amountError}</span>}
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {WITHDRAW_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount((current) => String(Math.round((Number(current) || 0) + value)))}
              className="h-9 rounded-md border border-line bg-surface font-poppins text-[11px] font-semibold text-white transition-colors hover:border-gold"
            >
              +{formatAmount(value)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Your Receiving Number</SectionTitle>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Number to receive the payout"
          aria-label="Receiving number"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className={fieldClass}
        />
        <span className="mt-1 block text-[11px] text-ink-muted">The agent will send your payout to this number.</span>
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
              <ChevronDown className={`size-5 text-ink-muted transition-transform ${remindersOpen ? 'rotate-180' : ''}`} />
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
            toast={{ message: error || message, type: error ? 'error' : 'success', id: error ? 'err' : 'ok' }}
            onClose={() => { setError(''); setMessage(''); }}
          />
        )}
        <button
          disabled={submitting || !canSubmit}
          className="h-11 w-full rounded-md bg-gold font-poppins text-[14px] font-bold text-on-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'SUBMIT'}
        </button>
      </div>
    </form>
  )
}
