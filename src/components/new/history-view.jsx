import { DISPLAY_CURRENCY } from '@/lib/currency'
import Loader from '@/components/loader'
import PnlMarkets from '@/components/new/pnl-markets'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, MoveRight } from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

// One tab per category, the same tabs as the admin member page. `kind` picks
// the status filters and the card layout: exchange (9W / 9 Wickets markets,
// Toss being cricket toss markets), sportsbook (SABA, BTI) and casino (one
// line per game round).
const sources = [
    { label: 'Exchange', value: 'exchange', category: 'exchange', kind: 'exchange' },
    { label: 'FancyBet', value: 'exchange', category: 'fancy', kind: 'exchange' },
    { label: 'Toss', value: 'exchange', category: 'toss', kind: 'exchange' },
    { label: 'Sportsbook', value: 'exchange', category: 'sportsbook', kind: 'exchange' },
    { label: 'BookMaker', value: 'exchange', category: 'bookmaker', kind: 'exchange' },
    { label: 'SABA SPORTS', value: 'saba', kind: 'sportsbook' },
    { label: 'BTI', value: 'bti', kind: 'sportsbook' },
    { label: 'Casino', value: 'casino', kind: 'casino' },
]

const statusFiltersByKind = {
    exchange: [
        { label: 'ALL', value: 'all' },
        { label: 'Settled', value: 'settled' },
        { label: 'Matched', value: 'pending' },
        { label: 'Unmatched', value: 'unmatched' },
        { label: 'Voided', value: 'void' },
    ],
    sportsbook: [
        { label: 'ALL', value: 'all' },
        { label: 'Settled', value: 'settled' },
        { label: 'Open', value: 'pending' },
        { label: 'Voided', value: 'void' },
    ],
    sports: [
        { label: 'ALL', value: 'all' },
        { label: 'Open', value: 'pending' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Voided', value: 'void' },
    ],
    // A casino round settles at once: won, lost or void.
    casino: [
        { label: 'ALL', value: 'all' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Voided', value: 'void' },
    ],
}

const CATEGORY_LABEL = {
    exchange: 'Exchange',
    bookmaker: 'BookMaker',
    fancy: 'FancyBet',
    toss: 'Toss',
    sportsbook: 'Sportsbook',
    casino: 'Casino',
}

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

const money = (value) => `${DISPLAY_CURRENCY} ${Number(value || 0).toFixed(2)}`
const when = (value) => value ? new Date(value).toLocaleString() : '—'

const chipClass = (active) => `h-[30px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors ${active ? 'border-gold bg-gold text-on-gold' : 'border-line-strong bg-transparent text-ink-soft hover:border-gold/60'}`

export default function HistoryView({ profitLoss = false }) {
    const [activeSource, setActiveSource] = useState(sources[0])
    const source = activeSource.value
    const kind = activeSource.kind
    const statusFilters = statusFiltersByKind[kind] || statusFiltersByKind.exchange
    const [status, setStatus] = useState('all')
    const [preset, setPreset] = useState('week')
    const [range, setRange] = useState(() => presetRange(7))
    const [showCustom, setShowCustom] = useState(false)
    const [rows, setRows] = useState([])
    // Profit & Loss: one line per market with its bets (9Wickets layout).
    const [markets, setMarkets] = useState([])
    const [totals, setTotals] = useState(null)
    const [loading, setLoading] = useState(!profitLoss)
    // Profit & Loss is a report: it only loads after the user taps Submit.
    const [submittedQuery, setSubmittedQuery] = useState(null)
    const [error, setError] = useState('')
    const { from, to } = range
    // Tab strip: arrows appear on the side that has more tabs to scroll to.
    const tabsRef = useRef(null)
    const [tabEdges, setTabEdges] = useState({ left: false, right: false })
    const updateTabEdges = () => {
        const el = tabsRef.current
        if (!el) return
        setTabEdges({
            left: el.scrollLeft > 2,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
        })
    }
    const scrollTabs = (direction) => {
        const el = tabsRef.current
        if (el) el.scrollBy({ left: direction * Math.max(140, el.clientWidth * 0.6), behavior: 'smooth' })
    }
    useEffect(() => {
        updateTabEdges()
        window.addEventListener('resize', updateTabEdges)
        return () => window.removeEventListener('resize', updateTabEdges)
    }, [])

    const resetReport = () => {
        if (!profitLoss) return
        setSubmittedQuery(null)
        setRows([])
        setMarkets([])
        setTotals(null)
        setError('')
    }

    const chooseSource = (item, event) => {
        setActiveSource(item)
        // Bring a half-hidden tab fully into view.
        event?.currentTarget?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        // Each category has its own status filters: start again from ALL.
        setStatus('all')
        setMarkets([])
        setRows([])
        setTotals(null)
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
        // P&L and the exchange history tabs: one card per market (9Wickets layout).
        if (profitLoss || kind === 'exchange') params.set('group', 'market')
        return params.toString()
    }, [activeSource.category, from, kind, profitLoss, source, status, to])

    const activeQuery = profitLoss ? submittedQuery : query

    useEffect(() => {
        if (!activeQuery) return undefined
        let active = true
        let inFlight = false
        let controller = null
        const path = profitLoss ? '/api/betting/profit-loss' : '/api/betting/history'

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
                setMarkets(Array.isArray(data?.markets) ? data.markets : [])
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
            <header className="sticky top-0 z-20 bg-account-header">
                <PageTitle title={profitLoss ? 'Profit & Loss' : 'Bets History'} titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
                <div className="relative">
                    {tabEdges.left && (
                        <button
                            type="button"
                            aria-label="Scroll tabs left"
                            onClick={() => scrollTabs(-1)}
                            className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-start bg-gradient-to-r from-account-header via-account-header/90 to-transparent pl-1 text-white"
                        >
                            <ChevronLeft className="size-5" strokeWidth={2} />
                        </button>
                    )}
                    <div ref={tabsRef} onScroll={updateTabEdges} className="no-scrollbar flex overflow-x-auto scroll-smooth" role="tablist" aria-label="History source tabs">
                        {sources.map((item) => (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeSource === item}
                                key={`${item.value}-${item.category || item.label}`}
                                onClick={(event) => chooseSource(item, event)}
                                className={`h-[38px] min-w-[92px] shrink-0 whitespace-nowrap border-b-[3px] px-4 text-[14px] font-medium transition-colors ${activeSource === item ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {tabEdges.right && (
                        <button
                            type="button"
                            aria-label="Scroll tabs right"
                            onClick={() => scrollTabs(1)}
                            className="absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end bg-gradient-to-l from-account-header via-account-header/90 to-transparent pr-1 text-white"
                        >
                            <ChevronRight className="size-5" strokeWidth={2} />
                        </button>
                    )}
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

                {loading && <Loader />}
                {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
                {!loading && !error && rows.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                        <p className="text-[15px] text-ink-soft">No data found</p>
                        <p className="text-[12px] text-ink-muted">{profitLoss && !submittedQuery ? 'Select a date range and tap Submit' : 'Try a different date range or filter'}</p>
                    </div>
                )}

                {(profitLoss || kind === 'exchange') && !loading && <PnlMarkets markets={markets} showStatus={!profitLoss} />}

                <div className="space-y-2">
                    {(markets.length ? [] : rows).map((row, index) => {
                        const firstSelection = Array.isArray(row.selections) ? row.selections[0] : null
                        const stake = row.stake ?? row.bet_amount ?? 0
                        const pl = row.pl ?? row.profit_loss ?? row.amount ?? 0
                        const label = row.event_name || firstSelection?.event_name || row.market || row.game_name || row.selection || row.description || `${source} record`
                        const market = row.market || firstSelection?.market_name || ''
                        const selection = row.selection || firstSelection?.selection_name || ''
                        // Fancy odds come as run/rate ("163/100"): show them as sent.
                        const odds = row.odds_text || (row.total_odds ?? firstSelection?.odds)
                        const isCasino = kind === 'casino'
                        const provider = row.provider_label || row.provider_name || row.provider || row.source || ''
                        const context = isCasino
                            ? provider
                            : [kind === 'exchange' ? '' : provider, row.sport, row.league].filter(Boolean).join(' · ')
                        const badge = isCasino
                            ? 'Casino'
                            : kind === 'exchange'
                                ? CATEGORY_LABEL[String(row.category || activeSource.category || '').toLowerCase()] || activeSource.label
                                : activeSource.label
                        const title = isCasino ? (row.game_name || row.market || 'Casino') : label
                        const detail = isCasino ? selection : [market, selection].filter(Boolean).join(' · ')
                        return <article key={row.id || row.reference_id || index} className="rounded-md border border-line bg-surface p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                                <strong className="min-w-0 truncate text-[13px]">{title}</strong>
                                <span className="flex shrink-0 items-center gap-1.5">
                                    <span className="rounded border border-gold/40 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-gold">{badge}</span>
                                    <span className="text-[12px] capitalize text-gold">{row.status || 'settled'}</span>
                                </span>
                            </div>
                            {context && <p className="mt-1 truncate text-[11px] text-ink-muted">{context}</p>}
                            {detail && <p className="mt-1 text-[11px] text-ink-soft">{detail}</p>}
                            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line-strong pt-2.5 text-[11px] text-ink-muted">
                                <span>Stake<br /><strong className="text-ink">{money(stake)}</strong></span>
                                {!isCasino && odds !== null && odds !== undefined && odds !== '' && <span>Odds<br /><strong className="text-ink">{row.fancy || Number.isNaN(Number(odds)) ? odds : Number(odds).toFixed(2)}</strong></span>}
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
