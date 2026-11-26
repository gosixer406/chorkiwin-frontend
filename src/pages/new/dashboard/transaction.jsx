import { DISPLAY_CURRENCY } from '@/lib/currency'
import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { Pagination } from '@/components/dashboard/activity-log'
import { api } from '@/lib/api'

// Wallet → Transaction (same as b2b-frontend): only money in and out of the
// account — gateway deposits / withdrawals and the agent's deposits /
// withdrawals (Banking). Bets, wins, bonuses and P2P transfers are not listed
// here (P2P has its own log at /dashboard/p2p-log).
const TABS = [['', 'All'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw']]
const money = (value) => `${DISPLAY_CURRENCY} ${Math.abs(Number(value || 0)).toFixed(2)}`

function describe(row) {
    const type = String(row.type || '').toLowerCase()
    const kind = String(row.metadata_json?.kind || '')
    const isIn = Number(row.amount) >= 0
    const viaAgent = kind.startsWith('banking_transfer') || kind.startsWith('staff_transfer')
    return {
        isIn,
        title: isIn ? 'Deposit' : 'Withdraw',
        via: viaAgent ? 'Via agent' : type === 'deposit' || type === 'withdrawal' ? 'Payment' : '',
    }
}

const STATUS_TONE = {
    completed: 'text-emerald-400',
    pending: 'text-gold-light',
    failed: 'text-red-400',
    cancelled: 'text-red-400',
    rejected: 'text-red-400',
}

export default function Transaction() {
    const [direction, setDirection] = useState('')
    const [page, setPage] = useState(1)
    const [rows, setRows] = useState([])
    const [meta, setMeta] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        const params = new URLSearchParams({ scope: 'funds', page: String(page), limit: '20' })
        if (direction) params.set('direction', direction)
        api.get(`/api/wallet/transactions?${params}`, { cache: 'no-store' })
            .then((response) => {
                if (!active) return
                setRows(response.data || [])
                setMeta(response.meta || {})
            })
            .catch((requestError) => active && setError(requestError.message || 'Unable to load transactions.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [direction, page])

    const pickTab = (value) => {
        if (value === direction) return
        setLoading(true)
        setError('')
        setPage(1)
        setDirection(value)
    }
    const changePage = (next) => {
        if (next < 1 || next === page) return
        setLoading(true)
        setError('')
        setPage(next)
    }

    return <>
        <PageTitle title="Transaction" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        <div className="grid grid-cols-3 border-b border-line bg-account-header" role="tablist" aria-label="Transaction type">
            {TABS.map(([value, label]) => <button key={label} type="button" role="tab" aria-selected={direction === value} onClick={() => pickTab(value)} className={`h-10 border-b-2 py-2.5 text-sm font-medium ${direction === value ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}>{label}</button>)}
        </div>
        <div className="space-y-2 px-2 py-4 text-white">
            {error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            {loading && <p className="py-12 text-center text-ink-muted">Loading transactions…</p>}
            {!loading && !error && rows.length === 0 && <p className="py-12 text-center text-ink-muted">No deposit or withdraw yet.</p>}
            {!loading && rows.map((row) => {
                const { isIn, title, via } = describe(row)
                const status = String(row.status || '').toLowerCase()
                return <article key={row.id} className="rounded-md border border-line bg-surface p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <strong>{title}{via && <span className="ml-2 text-xs font-normal text-ink-muted">{via}</span>}</strong>
                        <strong className={isIn ? 'text-emerald-400' : 'text-red-400'}>{isIn ? '+' : '−'} {money(row.amount)}</strong>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-ink-soft">{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</span>
                        <span className={`capitalize ${STATUS_TONE[status] || 'text-ink-soft'}`}>{status || '-'}</span>
                    </div>
                    {row.balance_after != null && <p className={`mt-1 text-right text-[11px] ${isIn ? 'text-ink-muted' : 'text-red-400'}`}>Balance after: {money(row.balance_after)}</p>}
                </article>
            })}
            {!loading && <Pagination meta={meta} page={page} onChange={changePage} />}
        </div>
    </>
}
