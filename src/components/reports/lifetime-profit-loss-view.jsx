import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/currency'

const when = (value) => value ? new Date(value).toLocaleString('en-GB') : '—'
const today = () => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 10)
}

export default function LifetimeProfitLossView({ dark = false, title = 'Life Time P&L', daily = false }) {
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reload, setReload] = useState(0)
    const [selectedDate, setSelectedDate] = useState(today)

    useEffect(() => {
        let active = true
        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 20_000)
        const params = new URLSearchParams({ limit: '100' })
        if (daily) {
            params.set('from', selectedDate)
            params.set('to', selectedDate)
            // Keep a user-selected calendar date local to the device rather
            // than unintentionally reporting the neighbouring UTC date.
            params.set('tz_offset', String(-new Date().getTimezoneOffset()))
        }
        api.get(`/api/betting/lifetime-profit-loss?${params.toString()}`, {
            cache: 'no-store',
            signal: controller.signal,
        })
            .then((response) => active && setReport(response.data || null))
            .catch((requestError) => {
                if (!active) return
                setError(requestError.name === 'AbortError'
                    ? 'The report took too long to calculate. Please press Retry.'
                    : requestError.message || 'Unable to load profit/loss.')
            })
            .finally(() => {
                window.clearTimeout(timeout)
                if (active) setLoading(false)
            })
        return () => {
            active = false
            window.clearTimeout(timeout)
            controller.abort()
        }
    }, [daily, reload, selectedDate])

    const totals = report?.totals || {}
    const shell = dark ? 'bg-page text-white' : 'bg-[#F5F8F9] text-on-gold'
    const panel = dark ? 'border-line bg-surface' : 'border-ink-muted bg-white'
    const muted = dark ? 'text-ink-soft' : 'text-ink-dim'

    const refresh = () => {
        setLoading(true)
        setError('')
        setReload((value) => value + 1)
    }

    return <div className={`min-h-full ${shell}`}>
        <PageTitle title={title} titleClass="font-poppins text-[15px] font-bold tracking-tight" className={dark ? 'min-h-[51px]! bg-account-header px-3! text-white' : ''} />
        <div className="space-y-4 p-3">
            {daily && <label className={`block rounded-xl border p-3 text-xs ${panel}`}>
                <span className={`mb-1 block font-semibold ${dark ? 'text-white' : 'text-black'}`}>Profit/loss date</span>
                <input
                    type="date"
                    value={selectedDate}
                    max={today()}
                    onChange={(event) => {
                        setLoading(true)
                        setError('')
                        setSelectedDate(event.target.value || today())
                    }}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm ${dark ? 'border-line bg-page text-ink focus:border-gold' : 'border-ink-muted bg-white text-on-gold'}`}
                    aria-label="Select profit and loss date"
                />
            </label>}
            <div className={`rounded-2xl border p-4 ${panel}`}>
                <div className="flex items-start justify-between gap-3"><div><p className={`text-xs ${muted}`}>{daily ? `Net profit/loss · ${selectedDate}` : 'Net lifetime profit/loss'}</p><strong className={`mt-1 block text-2xl ${Number(totals.pl) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(totals.pl)}</strong></div><button type="button" onClick={refresh} className={dark ? 'btn-new rounded-lg px-4 py-2 text-xs' : 'rounded-lg bg-[#FFC800] px-4 py-2 text-xs font-bold text-black'}>{error ? 'Retry' : 'Refresh'}</button></div>
                <div className={`mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs ${dark ? 'border-line-strong' : 'border-[#EEF3F5]'}`}><span className={muted}>Stake<br/><strong className={dark ? 'text-white' : 'text-black'}>{formatMoney(totals.stake)}</strong></span><span className={muted}>Returned<br/><strong className={dark ? 'text-white' : 'text-black'}>{formatMoney(totals.won)}</strong></span><span className={muted}>Settled<br/><strong className={dark ? 'text-white' : 'text-black'}>{totals.count || 0}</strong></span></div>
                {!daily && <div className={`mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-center text-xs ${dark ? 'border-line-strong' : 'border-[#EEF3F5]'}`}>
                    <span className={muted}>Total Deposit<br/><strong className="text-emerald-500">{formatMoney(totals.total_deposited)}</strong></span>
                    <span className={muted}>Total Withdraw<br/><strong className="text-red-500">{formatMoney(totals.total_withdrawn)}</strong></span>
                </div>}
            </div>

            {loading && <Loader />}
            {error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

            {!loading && !error && <>
                <section aria-label="P&L by channel">
                    <h2 className="mb-2 text-sm font-bold">By channel</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {(report?.breakdown || []).map((item) => <article key={item.source} className={`rounded-xl border p-3 text-xs ${panel}`}><strong>{item.label}</strong><p className={`mt-2 ${muted}`}>{item.count} settled records</p><p className={`mt-1 text-base font-bold ${Number(item.pl) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(item.pl)}</p></article>)}
                    </div>
                </section>

                <section aria-label="Recent settled activity">
                    <h2 className="mb-2 text-sm font-bold">Recent settled activity</h2>
                    {!(report?.rows || []).length && <p className={`rounded-xl border p-8 text-center ${panel} ${muted}`}>{daily ? 'No settled gaming activity found for this date.' : 'No settled gaming activity found.'}</p>}
                    <div className="space-y-2">
                        {(report?.rows || []).map((row, index) => {
                            const pl = Number(row.pl || 0)
                            const label = row.event_name || row.game_name || row.market || row.selection || row.source_label
                            return <article key={`${row.source}-${row.id || row.reference_id || index}`} className={`rounded-xl border p-4 text-sm ${panel}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate">{label}</strong><span className={`text-xs ${muted}`}>{row.source_label} · {when(row.settled || row.placed || row.created_at)}</span></div><strong className={pl >= 0 ? 'text-emerald-500' : 'text-red-500'}>{formatMoney(pl)}</strong></div><div className={`mt-2 flex justify-between text-xs ${muted}`}><span>Stake: {formatMoney(row.stake)}</span><span>Returned: {formatMoney(row.won)}</span><span className="capitalize">{row.status}</span></div></article>
                        })}
                    </div>
                </section>
            </>}
        </div>
    </div>
}
