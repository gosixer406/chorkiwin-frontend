import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, MoveRight } from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

const sources = [
    { label: 'Exchange', value: 'exchange', category: 'exchange' },
    { label: 'BookMaker', value: 'exchange', category: 'bookmaker' },
    { label: 'FancyBet', value: 'exchange', category: 'fancy' },
    { label: 'SportsBook', value: 'exchange', category: 'sportsbook' },
    { label: 'SABA', value: 'saba' },
    { label: 'BTI', value: 'bti' },
    { label: 'UG', value: 'ug' },
    { label: 'SBO Virtual', value: 'sbobet' },
    { label: 'SBOBET', value: 'sbobet' },
    { label: 'Lucky', value: 'lucky' },
    { label: 'TF', value: 'tf' },
    { label: 'BetBy', value: 'betby' },
    { label: 'Sports', value: 'sports' },
    { label: 'Casino', value: 'casino' },
]

const statusFilters = [
    { label: 'ALL', value: 'all' },
    { label: 'Settled', value: 'settled' },
    { label: 'Matched', value: 'pending' },
    { label: 'Unmatched', value: 'unmatched' },
    { label: 'Voided', value: 'void' },
]

const presets = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'From Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'week', days: 7 },
]

const pad = (value) => String(value).padStart(2, '0')
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const displayDate = (value) => {
    if (!value) return '--/--/----'
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
}
const presetRange = (days) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    return { from: isoDate(from), to: isoDate(to) }
}

const money = (value) => `USD ${Number(value || 0).toFixed(2)}`
const when = (value) => value ? new Date(value).toLocaleString() : '—'

const chipClass = (active) => `h-[30px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors ${active ? 'border-gold bg-gold text-on-gold' : 'border-line-strong bg-transparent text-ink-soft hover:border-gold/60'}`

export default function HistoryView({ profitLoss = false }) {
    const [activeSource, setActiveSource] = useState(sources[0])
    const source = activeSource.value
    const [status, setStatus] = useState('all')
    const [preset, setPreset] = useState('week')
    const [range, setRange] = useState(() => presetRange(7))
    const [showCustom, setShowCustom] = useState(false)
    const [rows, setRows] = useState([])
    const [totals, setTotals] = useState(null)
    const [loading, setLoading] = useState(!profitLoss)
    // Profit & Loss is a report: it only loads after the user taps Submit.
    const [submittedQuery, setSubmittedQuery] = useState(null)
    const [error, setError] = useState('')
    const { from, to } = range

    const resetReport = () => {
        if (!profitLoss) return
        setSubmittedQuery(null)
        setRows([])
        setTotals(null)
        setError('')
    }

    const chooseSource = (item) => {
        setActiveSource(item)
        resetReport()
    }

    const choosePreset = (item) => {
        resetReport()
        setPreset(item.value)
        setRange(presetRange(item.days))
        setShowCustom(false)
    }

    const setCustomDate = (key) => (event) => {
        resetReport()
        setPreset('custom')
        setRange((current) => ({ ...current, [key]: event.target.value }))
    }

    const query = useMemo(() => {
        const params = new URLSearchParams({ source, limit: '100' })
        if (activeSource.category) params.set('category', activeSource.category)
        if (!profitLoss && status !== 'all') params.set('status', status)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        // Report calendar dates in the device's timezone, not UTC.
        if (profitLoss) params.set('tz_offset', String(-new Date().getTimezoneOffset()))
        return params.toString()
    }, [activeSource.category, from, profitLoss, source, status, to])

    const activeQuery = profitLoss ? submittedQuery : query

    useEffect(() => {
        if (!activeQuery) return undefined
        let active = true
        let inFlight = false
        let controller = null
        const path = profitLoss ? '/api/betting/lifetime-profit-loss' : '/api/betting/history'

        const load = async (showLoading = false) => {
            if (!active || inFlight) return
            inFlight = true
            controller = new AbortController()
            if (showLoading) setLoading(true)
            setError('')
            try {
                const response = await api.get(`${path}?${activeQuery}`, {
                    signal: controller.signal,
                    cache: 'no-store',
                })
                if (!active || controller.signal.aborted) return
                const data = response.data
                setRows(Array.isArray(data) ? data : (data?.rows || []))
                setTotals(data?.totals || null)
            } catch (requestError) {
                if (active && !controller.signal.aborted) setError(requestError.message)
            } finally {
                inFlight = false
                controller = null
                if (active) setLoading(false)
            }
        }

        const refreshWhenVisible = () => {
            if (document.visibilityState === 'visible') load(false)
        }
        load(true)
        if (profitLoss) return () => {
            active = false
            controller?.abort()
        }
        window.addEventListener('focus', refreshWhenVisible)
        document.addEventListener('visibilitychange', refreshWhenVisible)
        return () => {
            active = false
            controller?.abort()
            window.removeEventListener('focus', refreshWhenVisible)
            document.removeEventListener('visibilitychange', refreshWhenVisible)
        }
    }, [activeQuery, profitLoss])

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <header className="sticky top-0 z-20 bg-bar">
                <PageTitle title={profitLoss ? 'Profit & Loss' : 'Bets History'} titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-bar px-3! text-ink" />
                <div className="no-scrollbar flex overflow-x-auto border-b border-line" role="tablist" aria-label="History source tabs">
                    {sources.map((item) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSource === item}
                            key={`${item.value}-${item.category || item.label}`}
                            onClick={() => chooseSource(item)}
                            className={`h-[38px] min-w-[92px] shrink-0 whitespace-nowrap border-b-[3px] px-4 text-[14px] font-medium transition-colors ${activeSource === item ? 'border-gold text-gold' : 'border-transparent text-ink-soft hover:text-ink'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-3 px-2.5 py-3 text-ink">
                <div className="rounded-md border border-line bg-surface px-2.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                            {presets.map((item) => (
                                <button type="button" key={item.value} onClick={() => choosePreset(item)} className={chipClass(preset === item.value)}>{item.label}</button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCustom((current) => !current)}
                            aria-expanded={showCustom}
                            aria-label="Choose custom date range"
                            className={`flex h-[30px] shrink-0 items-center gap-1 pl-2 ${preset === 'custom' ? 'text-gold' : 'text-ink-soft'}`}
                        >
                            <CalendarDays className="size-[18px]" strokeWidth={1.5} />
                            <ChevronDown className={`size-4 transition-transform ${showCustom ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                        </button>
                    </div>

                    {showCustom && (
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                            <label className="text-[11px] text-ink-muted">From
                                <input value={from} max={to || undefined} onChange={setCustomDate('from')} type="date" className="mt-1 block h-8 w-full rounded-md border border-line bg-page px-2 text-[12px] text-ink [color-scheme:dark] focus:border-gold" />
                            </label>
                            <label className="text-[11px] text-ink-muted">To
                                <input value={to} min={from || undefined} onChange={setCustomDate('to')} type="date" className="mt-1 block h-8 w-full rounded-md border border-line bg-page px-2 text-[12px] text-ink [color-scheme:dark] focus:border-gold" />
                            </label>
                        </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                            <CalendarDays className="size-[18px] text-ink-soft" strokeWidth={1.5} />
                            <span>{displayDate(from)}</span>
                            <MoveRight className="size-3.5 text-ink-muted" strokeWidth={1.5} />
                            <span>{displayDate(to)}</span>
                        </div>
                        {!profitLoss && <span className="shrink-0 text-[11px] text-ink-muted">{rows.length} records</span>}
                    </div>
                </div>

                {profitLoss && (
                    <button
                        type="button"
                        onClick={() => setSubmittedQuery(`${query}&_=${Date.now()}`)}
                        disabled={loading || !from || !to}
                        className="h-[35px] w-full rounded-xl bg-gold text-[14px] font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? 'Loading…' : 'Submit'}
                    </button>
                )}

                {!profitLoss && (
                    <div className="no-scrollbar flex gap-2 overflow-x-auto">
                        {statusFilters.map((item) => (
                            <button type="button" key={item.value} onClick={() => setStatus(item.value)} className={chipClass(status === item.value)}>{item.label}</button>
                        ))}
                    </div>
                )}

                {totals && rows.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 rounded-md border border-line bg-surface p-3 text-center text-xs">
                        <span className="text-ink-muted">Stake<br /><strong className="text-ink">{money(totals.stake)}</strong></span>
                        <span className="text-ink-muted">Won<br /><strong className="text-ink">{money(totals.won)}</strong></span>
                        <span className="text-ink-muted">P/L<br /><strong className={Number(totals.pl) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(totals.pl)}</strong></span>
                    </div>
                )}

                {loading && <p className="py-16 text-center text-[13px] text-ink-muted">Loading records…</p>}
                {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
                {!loading && !error && rows.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                        <p className="text-[15px] text-ink-soft">No data found</p>
                        <p className="text-[12px] text-ink-muted">{profitLoss && !submittedQuery ? 'Select a date range and tap Submit' : 'Try a different date range or filter'}</p>
                    </div>
                )}

                <div className="space-y-2">
                    {rows.map((row, index) => {
                        const firstSelection = Array.isArray(row.selections) ? row.selections[0] : null
                        const stake = row.stake ?? row.bet_amount ?? 0
                        const pl = row.pl ?? row.profit_loss ?? row.amount ?? 0
                        const label = row.event_name || firstSelection?.event_name || row.market || row.game_name || row.selection || row.description || `${source} record`
                        const market = row.market || firstSelection?.market_name || ''
                        const selection = row.selection || firstSelection?.selection_name || ''
                        const odds = row.total_odds ?? firstSelection?.odds
                        const provider = row.provider || row.source || ''
                        const context = [provider, row.sport, row.league].filter(Boolean).join(' · ')
                        return <article key={row.id || row.reference_id || index} className="rounded-md border border-line bg-surface p-3 text-sm">
                            <div className="flex justify-between gap-3"><strong className="truncate text-[13px]">{label}</strong><span className="shrink-0 text-[12px] capitalize text-gold">{row.status || 'settled'}</span></div>
                            {context && <p className="mt-1 truncate text-[11px] text-ink-muted">{context}</p>}
                            {(market || selection) && <p className="mt-1 text-[11px] text-ink-soft">{[market, selection].filter(Boolean).join(' · ')}</p>}
                            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line-strong pt-2.5 text-[11px] text-ink-muted">
                                <span>Stake<br /><strong className="text-ink">{money(stake)}</strong></span>
                                {odds !== null && odds !== undefined && odds !== '' && <span>Odds<br /><strong className="text-ink">{Number(odds).toFixed(2)}</strong></span>}
                                <span>{row.potential_win !== null && row.potential_win !== undefined ? 'Potential win' : 'Won'}<br /><strong className="text-ink">{money(row.potential_win ?? row.won ?? row.actual_win)}</strong></span>
                                <span>P/L<br /><strong className={Number(pl) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(pl)}</strong></span>
                                <span className="col-span-2">Placed<br /><strong className="text-ink">{when(row.placed || row.created_at || row.started_at)}</strong></span>
                            </div>
                            {(row.reference_id || row.serial_number || row.id) && <p className="mt-2 truncate text-[10px] text-ink-muted">Bet ID: {row.reference_id || row.serial_number || row.id}</p>}
                        </article>
                    })}
                </div>
            </div>
        </div>
    )
}
