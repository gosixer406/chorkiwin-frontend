import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DISPLAY_CURRENCY } from '@/lib/currency'

// Profit & Loss, one card per market, as 9Wickets shows it:
//   SOCCER ▶ Algeria U23 v Eswatini U23 ▶ Match Odds  | start | settled | P/L
// Tapping a card opens its bets (Bet ID, Selection, Odds or fancy run/rate,
// Stake, Back/Lay, Placed, P/L) and the Back / Lay / Market subtotals.

const amount = (value) => Number(value || 0).toFixed(2)
const plClass = (value) => (Number(value) > 0 ? 'text-emerald-400' : Number(value) < 0 ? 'text-red-400' : 'text-ink')
const pad = (n) => String(n).padStart(2, '0')
const stamp = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
const sideLabel = (side) => (side === 'lay' ? 'Lay' : side === 'back' ? 'Back' : '—')
const statusLabel = (status) => {
    const value = String(status || '').toLowerCase()
    if (['pending', 'open', 'matched'].includes(value)) return 'Matched'
    return value ? value[0].toUpperCase() + value.slice(1) : '—'
}
const sideClass = (side) => (side === 'lay' ? 'bg-pink-300/20 text-pink-300' : side === 'back' ? 'bg-sky-300/20 text-sky-300' : 'text-ink-muted')

function MarketCard({ market, showStatus = false }) {
    const [open, setOpen] = useState(false)
    const bets = Array.isArray(market.bets) ? market.bets : []
    const hasFancy = bets.some((bet) => bet.fancy)
    const totals = [
        ['Total Stakes', market.total_stake, false],
        ['Back subtotal', market.back_subtotal, true],
        ['Lay subtotal', market.lay_subtotal, true],
        ['Market subtotal', market.market_subtotal ?? market.pl, true],
        ['Net Market Total', market.net_total ?? market.pl, true],
    ]
    return (
        <article className="overflow-hidden rounded-md border border-line bg-surface text-sm">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="block w-full p-3 text-left"
            >
                <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[12px] leading-5 text-ink-soft">
                        <span className="font-semibold uppercase text-ink-muted">{market.sport || 'Sports'}</span>
                        <span aria-hidden="true" className="mx-1 text-[9px] text-ink-muted">▶</span>
                        <strong className="text-ink">{market.event_name || '—'}</strong>
                        <span aria-hidden="true" className="mx-1 text-[9px] text-ink-muted">▶</span>
                        <span>{market.market || '—'}</span>
                    </p>
                    <span className="flex shrink-0 items-center gap-1.5">
                        <strong className={`text-[13px] ${plClass(market.pl)}`}>{amount(market.pl)}</strong>
                        <ChevronDown className={`size-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.75} />
                    </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-ink-muted">
                    <span>Start Time<br /><strong className="font-medium text-ink">{stamp(market.start_time)}</strong></span>
                    <span>Settled Date<br /><strong className="font-medium text-ink">{stamp(market.settled)}</strong></span>
                </div>
                {market.result_text && hasFancy && (
                    <p className="mt-1.5 text-[11px] text-ink-muted">Result: <strong className="text-gold">{market.result_text}</strong></p>
                )}
            </button>

            {open && (
                <div className="border-t border-line-strong bg-page">
                    <div className="no-scrollbar overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-[11px]">
                            <thead>
                                <tr className="text-ink-muted">
                                    {['Bet ID', 'Selection', hasFancy ? 'Odds / Run' : 'Odds', 'Stake', 'Type', 'Placed', 'Profit/Loss'].map((label, i) => (
                                        <th key={label} className={`border-b border-line px-2 py-1.5 font-medium ${i >= 2 && i !== 4 ? 'text-right' : 'text-left'}`}>{label}</th>
                                    ))}
                                    {showStatus && <th className="border-b border-line px-2 py-1.5 text-left font-medium">Status</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {bets.map((bet) => (
                                    <tr key={bet.id || bet.bet_id} className="text-ink">
                                        <td className="border-b border-line px-2 py-1.5 text-gold">{bet.bet_id || '—'}</td>
                                        <td className="border-b border-line px-2 py-1.5">{bet.selection || '—'}</td>
                                        <td className="border-b border-line px-2 py-1.5 text-right font-semibold">{bet.odds || '—'}</td>
                                        <td className="border-b border-line px-2 py-1.5 text-right">{amount(bet.stake)}</td>
                                        <td className="border-b border-line px-2 py-1.5">
                                            <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${sideClass(bet.side)}`}>{sideLabel(bet.side)}</span>
                                        </td>
                                        <td className="whitespace-nowrap border-b border-line px-2 py-1.5 text-right">{stamp(bet.placed)}</td>
                                        <td className={`border-b border-line px-2 py-1.5 text-right font-semibold ${plClass(bet.pl)}`}>{amount(bet.pl)}</td>
                                        {showStatus && <td className="border-b border-line px-2 py-1.5 capitalize text-gold">{statusLabel(bet.status)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <dl className="space-y-1 px-3 py-2.5 text-[12px]">
                        {totals.map(([label, value, signed]) => (
                            <div key={label} className={`flex items-center justify-between ${label === 'Net Market Total' ? 'border-t border-line-strong pt-1.5 font-semibold' : ''}`}>
                                <dt className="text-ink-muted">{label}</dt>
                                <dd className={signed ? plClass(value) : 'text-ink'}>{amount(value)}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </article>
    )
}

export default function PnlMarkets({ markets = [], totals = null, showStatus = false }) {
    if (!markets.length) return null
    return (
        <div className="space-y-2">
            {totals && (
                <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2.5 text-[13px]">
                    <span className="text-ink-muted">Total P/L</span>
                    <strong className={plClass(totals.pl)}>{DISPLAY_CURRENCY} {amount(totals.pl)}</strong>
                </div>
            )}
            {markets.map((market) => <MarketCard key={market.id} market={market} showStatus={showStatus} />)}
        </div>
    )
}
