import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Check, Copy } from 'lucide-react'
import { api } from '@/lib/api'
import { setUser } from '@/lib/auth'
import useSiteFeatures from '@/hooks/use-site-features'
import { CURRENCY, formatAmount } from './funds'
import { AmountField, Notice, SectionTitle, fieldClass } from './ui'

// Player-to-player balance transfer. Mirrors the server rules in
// /api/wallet/p2p/config so the player sees limit problems before sending.
export default function P2pTab({ onSubmitted }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const features = useSiteFeatures()

  const [form, setForm] = useState({ recipient: '', amount: '', note: '' })
  const [p2pConfig, setP2pConfig] = useState(null)
  const [usernameCopied, setUsernameCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadConfig = async () => {
    try {
      const response = await api.get('/api/wallet/p2p/config', { cache: 'no-store' })
      setP2pConfig(response.data)
    } catch {
      setP2pConfig(null)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the request resolves
    loadConfig()
  }, [])

  const username = String(user?.username || '')
  const limits = p2pConfig?.limits
  const today = p2pConfig?.today
  const p2pAllowed = p2pConfig ? p2pConfig.allowed !== false : true
  const hasValue = (value) => value !== null && value !== undefined
  const dailyCountReached = hasValue(today?.remaining_count) && today.remaining_count <= 0

  const limitError = (value) => {
    if (!limits) return ''
    const amount = Number(value)
    if (!amount) return ''
    if (amount < limits.min_amount) return `Minimum P2P transfer is ${CURRENCY}${formatAmount(limits.min_amount)}`
    if (limits.max_per_transfer > 0 && amount > limits.max_per_transfer)
      return `Maximum per transfer is ${CURRENCY}${formatAmount(limits.max_per_transfer)}`
    if (dailyCountReached) return `Daily limit reached: ${limits.daily_count_limit} transfers per day`
    if (hasValue(today?.remaining_amount) && amount > today.remaining_amount)
      return `You can send ${CURRENCY}${formatAmount(today.remaining_amount)} more today`
    return ''
  }
  const amountError = limitError(form.amount)

  const update = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (amountError) {
      setError(amountError)
      return
    }
    setSubmitting(true)
    try {
      const response = await api.post('/api/wallet/p2p', form)
      setMessage(`${response.message}. Reference: ${response.data.reference_id}`)
      setForm({ recipient: '', amount: '', note: '' })
      if (response.data?.today)
        setP2pConfig((current) => (current ? { ...current, today: response.data.today } : current))
      const me = await api.get('/api/auth/me')
      dispatch(setUser(me.data))
      window.dispatchEvent(new CustomEvent('velki:balance-changed'))
      onSubmitted?.()
    } catch (requestError) {
      setError(requestError.message)
      loadConfig()
    } finally {
      setSubmitting(false)
    }
  }

  if (!features.p2p) {
    return (
      <div className="px-2.5 pt-10 text-center text-[13px] text-ink-muted">
        P2P transfer is not available on this site.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex min-h-full flex-1 flex-col gap-4 px-2.5 pb-28 pt-3.5">
      <section>
        <SectionTitle>My Username</SectionTitle>
        <div className="flex items-stretch gap-2">
          <span className="flex h-[46px] min-w-0 flex-1 items-center rounded-md border border-line bg-surface px-3 font-poppins text-[12px] font-medium text-white">
            <span className="truncate">{username || '—'}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(username)
              setUsernameCopied(true)
              setTimeout(() => setUsernameCopied(false), 1500)
            }}
            aria-label={usernameCopied ? 'Username copied' : 'Copy username'}
            className="grid h-[46px] w-12 flex-none place-items-center rounded-md bg-gold text-on-gold"
          >
            {usernameCopied ? <Check className="size-4.5" /> : <Copy className="size-4.5 -scale-x-100" />}
          </button>
        </div>
      </section>

      <section>
        <SectionTitle>Transfer To</SectionTitle>
        <div className="flex flex-col gap-3">
          <input
            required
            value={form.recipient}
            onChange={update('recipient')}
            placeholder="Recipient Username"
            aria-label="Recipient Username"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={fieldClass}
          />
          <div>
            <AmountField value={form.amount} onChange={update('amount')} placeholder="Transfer Amount" min={1} />
            {amountError && <span className="mt-1 block text-[11px] text-[#FF7A84]">{amountError}</span>}
          </div>
          <input value={form.note} onChange={update('note')} placeholder="Remark" aria-label="Remark" className={fieldClass} />
        </div>
      </section>

      <div className="sticky bottom-0 z-10 -mx-2.5 mt-auto space-y-2 bg-page px-2.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5">
        {!p2pAllowed && <Notice>P2P transfer is currently disabled for your account.</Notice>}
        {error && <Notice onDismiss={() => setError('')}>{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}
        <button
          disabled={submitting || !p2pAllowed || !form.recipient.trim() || !form.amount || !!amountError}
          className="h-11 w-full rounded-md bg-gold font-poppins text-[14px] font-bold text-on-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Transferring…' : 'SUBMIT'}
        </button>
      </div>
    </form>
  )
}
