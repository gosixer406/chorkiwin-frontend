import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import Loader from '@/components/loader'
import { api } from '@/lib/api'

// Profit & Loss in the agent panel's "Betting Profit & Loss : Main wallet"
// layout (the 9Wickets report): category tabs, the Period box (date + time,
// Just For Today / From Yesterday / Get P & L), Total Pnl, then one row per
// market (Market | Start Time | Settled date | Profit/Loss) whose + opens its
// bets and the market subtotals. Each tab also shows that category's P/L for
// the period, so the report reads category-wise at a glance.

const TABS = [
    { key: 'exchange', label: 'Exchange', source: 'exchange', category: 'exchange' },
    { key: 'fancy', label: 'FancyBet', source: 'exchange', category: 'fancy' },
    { key: 'bookmaker', label: 'BookMaker', source: 'exchange', category: 'bookmaker' },
    { key: 'sportsbook', label: 'Sportsbook', source: 'exchange', category: 'sportsbook' },
    { key: 'saba', label: 'SABA SPORTS', source: 'saba' },
    { key: 'toss', label: 'Toss', source: 'exchange', category: 'toss' },
    { key: 'casino', label: 'Casino', source: 'casino' },
]

const pad = (n) => String(n).padStart(2, '0')
const localDate = (offsetDays = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const dayRange = (offsetDays = 0) => ({ from: localDate(offsetDays), fromTime: '00:00', to: localDate(), toTime: '23:59' })
// The "to" minute is inclusive: it runs to its last second.
const isoFrom = (range) => new Date(`${range.from}T${range.fromTime}:00`).toISOString()
const isoTo = (range) => new Date(`${range.to}T${range.toTime}:59`).toISOString()

const money = (value) =>
    Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// A loss is red and in brackets, as 9Wickets prints it.
const signedMoney = (value) => (Number(value) < 0 ? `(${money(value)})` : money(value))
const plClass = (value) => (Number(value) < 0 ? 'text-red-400' : Number(value) > 0 ? 'text-emerald-400' : 'text-ink')
const stamp = (value) => {
    const d = value ? new Date(value) : null
    if (!d || Number.isNaN(d.getTime())) return '-'
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Fancy markets: Back is "Yes" (over the run), Lay is "No" (under it).
function TypeTag({ side, fancy }) {
    const label = side === 'lay' ? (fancy ? 'No' : 'Lay') : side === 'back' ? (fancy ? 'Yes' : 'Back') : '-'
    const color = label === 'No' ? 'bg-[#5ce37a]' : label === 'Yes' || label === 'Back' ? 'bg-[#72bbef]' : label === 'Lay' ? 'bg-[#faa9ba]' : ''
    return <span className={`rounded-sm px-1 font-semibold ${color ? `${color} text-[#1e1e1e]` : 'text-ink-muted'}`}>{label}</span>
}

function queryFor(tab, range, limit) {
    const params = new URLSearchParams({ source: tab.source, limit: String(limit), from: isoFrom(range), to: isoTo(range) })
    if (tab.category) params.set('category', tab.category)
    return params
}

export default function ProfitLossView() {
    const [tab, setTab] = useState(TABS[0])
    const [filters, setFilters] = useState(() => dayRange())
    const [applied, setApplied] = useState(filters)
    const [open, setOpen] = useState({})
    const [reloads, setReloads] = useState(0)

    const apply = (next) => {
        setFilters(next)
        setApplied(next)
        setOpen({})
        setReloads((n) => n + 1)
    }
    const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))

    // The chosen tab's markets (one line per market, with its bets).
    const requestKey = useMemo(() => {
        const params = queryFor(tab, applied, 1)
        params.set('group', 'market')
        return `${params}&_=${reloads}`
    }, [applied, reloads, tab])
    const [report, setReport] = useState({ key: '', markets: [], total: 0, error: '' })
    const loading = report.key !== requestKey
    useEffect(() => {
        let active = true
        const controller = new AbortController()
        api.get(`/api/betting/profit-loss?${requestKey}`, { signal: controller.signal, cache: 'no-store' })
            .then((response) => {
                if (!active) return
                const data = response.data || {}
                setReport({
                    key: requestKey,
                    markets: Array.isArray(data.markets) ? data.markets : [],
                    total: Number(data.totals?.pl || 0),
                    error: '',
                })
            })
            .catch((error) => {
                if (active && !controller.signal.aborted) {
                    setReport({ key: requestKey, markets: [], total: 0, error: error.message || 'Could not load Profit & Loss.' })
                }
            })
        return () => {
            active = false
            controller.abort()
        }
    }, [requestKey])

    // Every category's P/L for the same period, shown under its tab.
    const summaryKey = `${isoFrom(applied)}|${isoTo(applied)}|${reloads}`
    const [summary, setSummary] = useState({ key: '', values: {} })
    useEffect(() => {
        let active = true
        const controller = new AbortController()
        const [fromIso, toIso] = summaryKey.split('|')
        Promise.all(TABS.map(async (item) => {
            const params = new URLSearchParams({ source: item.source, limit: '1', from: fromIso, to: toIso })
            if (item.category) params.set('category', item.category)
            try {
                const response = await api.get(`/api/betting/profit-loss?${params}`, { signal: controller.signal, cache: 'no-store' })
                return [item.key, Number(response.data?.totals?.pl || 0)]
            } catch {
                return [item.key, null]
            }
        })).then((pairs) => {
            if (active) setSummary({ key: summaryKey, values: Object.fromEntries(pairs) })
        })
        return () => {
            active = false
            controller.abort()
        }
    }, [summaryKey])
    const summaryReady = summary.key === summaryKey
    const allTotal = summaryReady
        ? Object.values(summary.values).reduce((sum, value) => sum + (value || 0), 0)
        : null

    // Category tabs move sideways: swipe on a phone, drag with the mouse
    // (drag left → the tabs move left), and the chosen tab is kept in view.
    const tabsRef = useRef(null)
    useEffect(() => {
        const row = tabsRef.current
        const pill = row?.querySelector('[aria-selected="true"]')
        if (!row || !pill) return
        const left = pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2
        row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
    }, [tab])
    const dragRef = useRef(null)
    const onTabsPointerDown = (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return
        dragRef.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false }
    }
    const onTabsPointerMove = (event) => {
        const drag = dragRef.current
        if (!drag) return
        const dx = event.clientX - drag.x
        if (!drag.moved && Math.abs(dx) < 5) return
        if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId)
        drag.moved = true
        event.currentTarget.scrollLeft = drag.left - dx
    }
    const onTabsPointerUp = () => {
        const drag = dragRef.current
        dragRef.current = null
        // A drag is not a tap on the tab under the pointer.
        if (drag?.moved) {
            window.addEventListener('click', (clickEvent) => clickEvent.stopPropagation(), { capture: true, once: true })
        }
    }

    const input = 'h-8 rounded border border-line bg-page px-2 text-[12px] text-ink [color-scheme:dark] focus:border-gold'
    const th = 'border-b border-line-strong bg-surface-2 px-2 py-1.5 text-[11px] font-semibold text-ink-soft whitespace-nowrap'
    const td = 'border-b border-line px-2 py-1.5 text-[11px] text-ink'

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <header className="sticky top-0 z-20 bg-account-header">
                <PageTitle title="Profit & Loss" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
            </header>

            <div className="flex flex-1 flex-col gap-3 px-2.5 py-3 text-ink">
                {/* Category tabs, each with its P/L for the period. */}
                <div>
                    <div
                        ref={tabsRef}
                        role="tablist"
                        aria-label="Profit and loss categories"
                        onPointerDown={onTabsPointerDown}
                        onPointerMove={onTabsPointerMove}
                        onPointerUp={onTabsPointerUp}
                        onPointerCancel={onTabsPointerUp}
                        className="no-scrollbar relative flex cursor-grab select-none gap-0.5 overflow-x-auto overscroll-x-contain border-b-[3px] border-gold active:cursor-grabbing"
                    >
                        {TABS.map((item) => {
                            const value = summaryReady ? summary.values[item.key] : undefined
                            const selected = item.key === tab.key
                            return (
                                <button
                                    type="button"
                                    role="tab"
                                    key={item.key}
                                    draggable={false}
                                    aria-selected={selected}
                                    onClick={() => {
                                        setTab(item)
                                        setOpen({})
                                    }}
                                    className={`flex min-w-[92px] shrink-0 flex-col items-center rounded-t px-3 py-1 ${selected ? 'bg-gold text-on-gold' : 'bg-surface text-ink-soft hover:bg-surface-2'}`}
                                >
                                    <span className="whitespace-nowrap text-[13px] font-bold">{item.label}</span>
                                    <span className={`text-[10px] font-semibold ${selected ? '' : plClass(value)}`}>
                                        {value === undefined ? '…' : value === null ? '—' : signedMoney(value)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Period box. */}
                    <div className="flex flex-col gap-2.5 border-b border-line bg-surface px-2.5 py-3">
                        <span className="text-[12px] font-semibold text-ink-soft">Period</span>
                        <div className="grid grid-cols-[1fr_auto] gap-1.5">
                            <input type="date" aria-label="From date" value={filters.from} min={localDate(-30)} max={filters.to} onChange={setFilter('from')} className={input} />
                            <input type="time" aria-label="From time" value={filters.fromTime} onChange={setFilter('fromTime')} className={input} />
                            <span className="col-span-2 text-center text-[11px] text-ink-muted">to</span>
                            <input type="date" aria-label="To date" value={filters.to} min={filters.from} max={localDate()} onChange={setFilter('to')} className={input} />
                            <input type="time" aria-label="To time" value={filters.toTime} onChange={setFilter('toTime')} className={input} />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button type="button" onClick={() => apply(dayRange())} className="h-8 rounded border border-line-strong text-[12px] font-semibold text-ink-soft hover:border-gold">Just For Today</button>
                            <button type="button" onClick={() => apply(dayRange(-1))} className="h-8 rounded border border-line-strong text-[12px] font-semibold text-ink-soft hover:border-gold">From Yesterday</button>
                            <button type="button" onClick={() => apply(filters)} disabled={loading} className="h-8 rounded bg-gold text-[12px] font-bold text-on-gold disabled:opacity-60">
                                {loading ? 'Loading…' : 'Get P & L'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-[11px] leading-[1.6] text-ink-muted">
                    <p>Profit &amp; Loss enables you to review the bets you have placed.</p>
                    <p>Specify the time period during which your bets were placed, the type of markets on which the bets were placed, and the sport.</p>
                    <p>Profit &amp; Loss is available online for the past 30 days.</p>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[15px] font-bold">
                        Total Pnl: <span className={plClass(report.total)}>{loading ? '…' : signedMoney(report.total)}</span>
                    </span>
                    {allTotal !== null && (
                        <span className="text-[11px] text-ink-muted">
                            All categories: <strong className={plClass(allTotal)}>{signedMoney(allTotal)}</strong>
                        </span>
                    )}
                </div>

                {report.error && !loading && <div role="alert" className="rounded-md bg-red-500/10 p-3 text-[12px] text-red-300">{report.error}</div>}

                <div className="no-scrollbar overflow-x-auto rounded-md border border-line">
                    <table className="w-full min-w-[460px] border-collapse">
                        <thead>
                            <tr>
                                <th className={`${th} text-left`}>Market</th>
                                <th className={`${th} text-right`}>Start Time</th>
                                <th className={`${th} text-right`}>Settled date</th>
                                <th className={`${th} text-right`}>Profit/Loss</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="py-6"><Loader /></td></tr>
                            ) : report.markets.length ? (
                                report.markets.map((market) => {
                                    const expanded = !!open[market.id]
                                    const bets = Array.isArray(market.bets) ? market.bets : []
                                    const fancy = bets.some((bet) => bet.fancy)
                                    const casino = String(market.sport || '').toLowerCase() === 'casino' || tab.key === 'casino'
                                    const subtotals = [
                                        ['Total Stakes', market.total_stake, false],
                                        [fancy ? 'Yes subtotal' : 'Back subtotal', market.back_subtotal, true],
                                        [fancy ? 'No subtotal' : 'Lay subtotal', market.lay_subtotal, true],
                                        ['Market subtotal', market.market_subtotal ?? market.pl, true],
                                        ['Commission', 0, false],
                                        ['Net Market Total', market.net_total ?? market.pl, true],
                                    ]
                                    return (
                                        <Fragment key={market.id}>
                                            <tr>
                                                <td className={`${td} whitespace-normal`}>
                                                    {casino ? (
                                                        <strong>CASINO</strong>
                                                    ) : (
                                                        <>
                                                            {String(market.sport || '-').toUpperCase()}
                                                            <span aria-hidden="true" className="mx-1 text-[8px] text-ink-muted">▶</span>
                                                            <strong>{market.event_name || '-'}</strong>
                                                            <span aria-hidden="true" className="mx-1 text-[8px] text-ink-muted">▶</span>
                                                            {market.market || '-'}
                                                        </>
                                                    )}
                                                </td>
                                                <td className={`${td} whitespace-nowrap text-right`}>{stamp(market.start_time)}</td>
                                                <td className={`${td} whitespace-nowrap text-right`}>{stamp(market.settled)}</td>
                                                <td className={`${td} text-right`}>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className={plClass(market.pl)}>{money(market.pl)}</span>
                                                        <button
                                                            type="button"
                                                            aria-expanded={expanded}
                                                            aria-label={expanded ? 'Hide bets' : 'Show bets'}
                                                            onClick={() => setOpen((current) => ({ ...current, [market.id]: !current[market.id] }))}
                                                            className="grid size-4 place-items-center rounded-sm border border-ink-soft text-[12px] font-bold leading-none text-ink-soft"
                                                        >
                                                            {expanded ? '−' : '+'}
                                                        </button>
                                                    </span>
                                                </td>
                                            </tr>
                                            {expanded && (
                                                <tr>
                                                    <td colSpan={4} className="bg-page p-0">
                                                        <table className="w-full border-collapse">
                                                            <thead>
                                                                <tr>
                                                                    {['Bet ID', 'Selection', fancy ? 'Odds / Run' : 'Odds', 'Stake', 'Type', 'Placed', 'Profit/Loss'].map((label, i) => (
                                                                        <th key={label} className={`${th} ${i >= 2 && i !== 4 ? 'text-right' : i === 4 ? 'text-center' : 'text-left'}`}>{label}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {bets.map((bet) => (
                                                                    <tr key={bet.id || bet.bet_id}>
                                                                        <td className={`${td} text-gold`}>{bet.bet_id || '-'}</td>
                                                                        <td className={td}>{bet.selection || '-'}</td>
                                                                        {/* Fancy: run/rate as 9Wickets sends it ("163/100"). */}
                                                                        <td className={`${td} text-right`}>{bet.odds || '-'}</td>
                                                                        <td className={`${td} text-right`}>{money(bet.stake)}</td>
                                                                        <td className={`${td} text-center`}><TypeTag side={bet.side} fancy={bet.fancy || fancy} /></td>
                                                                        <td className={`${td} whitespace-nowrap text-right`}>{stamp(bet.placed)}</td>
                                                                        <td className={`${td} text-right ${plClass(bet.pl)}`}>{money(bet.pl)}</td>
                                                                    </tr>
                                                                ))}
                                                                {subtotals.map(([label, value, signed]) => (
                                                                    <tr key={label}>
                                                                        <td colSpan={6} className={`${td} text-right ${label === 'Net Market Total' ? 'font-bold' : ''}`}>
                                                                            {label}
                                                                            {label === 'Market subtotal' && market.result_text && fancy && (
                                                                                <span className="ml-2 font-normal text-ink-muted">Result: {market.result_text}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className={`${td} text-right ${label === 'Net Market Total' ? 'font-bold' : ''} ${signed ? plClass(value) : ''}`}>{money(value)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })
                            ) : (
                                <tr><td colSpan={4} className={`${td} py-6 text-center text-ink-muted`}>You have no bets in this time period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="text-[11px] text-ink-muted">Profit and Loss is shown net of commission.</p>
            </div>
        </div>
    )
}
