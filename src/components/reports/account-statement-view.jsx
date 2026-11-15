import Loader from '@/components/loader'
import { useEffect, useMemo, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'
import { formatMoney } from '@/lib/currency'

const transactionTypes = ['all', 'deposit', 'withdrawal']

const formatDate = (value) => value ? new Date(value).toLocaleString('en-GB') : '—'

export default function AccountStatementView({ dark = false }) {
    const [filters, setFilters] = useState({ type: 'all', from: '', to: '' })
    const [applied, setApplied] = useState(filters)
    const [page, setPage] = useState(1)
    const [rows, setRows] = useState([])
    const [meta, setMeta] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reload, setReload] = useState(0)

    const query = useMemo(() => {
        const params = new URLSearchParams({ page: String(page), limit: '50' })
        if (applied.type !== 'all') params.set('type', applied.type)
        if (applied.from) params.set('from', applied.from)
        if (applied.to) params.set('to', applied.to)
        return params.toString()
    }, [applied, page])

    useEffect(() => {
        let active = true
        api.get(`/api/account/statement?${query}`)
            .then((response) => {
                if (!active) return
                setRows(Array.isArray(response.data) ? response.data : [])
                setMeta(response.meta || {})
            })
            .catch((requestError) => active && setError(requestError.message || 'Unable to load account statement.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [query, reload])

    const applyFilters = () => {
        setLoading(true)
        setError('')
        setPage(1)
        setApplied(filters)
        setReload((value) => value + 1)
    }

    const changePage = (nextPage) => {
        setLoading(true)
        setError('')
        setPage(nextPage)
    }

    const shell = dark ? 'bg-page text-white' : 'bg-[#F5F8F9] text-on-gold'
    const panel = dark ? 'bg-surface border-line' : 'bg-white border-ink-muted'
    const muted = dark ? 'text-ink-soft' : 'text-ink-dim'
    const input = dark
        ? 'border-line-strong bg-surface text-white'
        : 'border-ink-muted bg-white text-on-gold'
    const pageHeight = dark ? 'min-h-full' : 'min-h-[calc(100dvh-44px)]'

    return <div className={`${pageHeight} ${shell}`}>
        <PageTitle
            title="Account Statement"
            titleClass="font-poppins text-[15px] font-bold tracking-tight"
            className={dark ? 'min-h-[51px]! bg-account-header px-3! text-white' : ''}
        />
        <div className="space-y-4 p-3">
            <div className={`grid grid-cols-2 gap-3 rounded-xl border p-3 text-center text-xs ${panel}`}>
                <span className={muted}>Balance<br/><strong className={dark ? 'text-white' : 'text-black'}>{formatMoney(meta.current_balance)}</strong></span>
                <span className={muted}>Entries<br/><strong className={dark ? 'text-white' : 'text-black'}>{meta.total || 0}</strong></span>
                <span className={muted}>Total Deposit<br/><strong className="text-emerald-500">{formatMoney(meta.total_deposited)}</strong></span>
                <span className={muted}>Total Withdraw<br/><strong className="text-red-500">{formatMoney(meta.total_withdrawn)}</strong></span>
            </div>

            <div className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-2 ${panel}`}>
                <label className={`text-xs ${muted}`}>Type
                    <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className={`mt-1 block w-full rounded-lg border px-3 py-2 capitalize ${input}`}>
                        {transactionTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                    </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <label className={`text-xs ${muted}`}>From<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className={`mt-1 block w-full rounded-lg border px-2 py-2 ${input}`} /></label>
                    <label className={`text-xs ${muted}`}>To<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className={`mt-1 block w-full rounded-lg border px-2 py-2 ${input}`} /></label>
                </div>
                <button type="button" onClick={applyFilters} className={dark ? 'btn-new rounded-lg px-4 py-2' : 'rounded-lg bg-[#FFC800] px-4 py-2 font-bold text-black'}>Apply filters</button>
            </div>

            {loading && <Loader />}
            {error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
            {!loading && !error && !rows.length && <p className={`py-12 text-center ${muted}`}>No account activity found.</p>}

            <div className="space-y-2">
                {rows.map((row) => {
                    const amount = Number(row.amount || 0)
                    const type = String(row.type || '').toLowerCase()
                    const isDeposit = type === 'deposit'
                    const isWithdrawal = type === 'withdrawal'
                    const amountClass = isDeposit ? 'text-emerald-500' : isWithdrawal ? 'text-red-500' : amount >= 0 ? 'text-emerald-500' : 'text-red-500'
                    const amountPrefix = isWithdrawal || amount < 0 ? '-' : '+'
                    return <article key={row.id} className={`rounded-xl border p-4 text-sm ${panel}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div><strong className="capitalize">{String(row.type || 'transaction').replaceAll('_', ' ')}</strong><p className={`mt-1 text-xs ${muted}`}>{row.description || row.reference_id || 'Wallet transaction'}</p></div>
                            <strong className={amountClass}>{amountPrefix}{formatMoney(Math.abs(amount))}</strong>
                        </div>
                        <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${muted}`}><span>{formatDate(row.created_at)}</span><span className="text-right">Balance: {formatMoney(row.balance_after)}</span><span className="capitalize">{row.status || 'completed'}</span><span className="truncate text-right">{row.reference_id || '—'}</span></div>
                    </article>
                })}
            </div>

            {(meta.has_prev || meta.has_next) && <div className="flex items-center justify-center gap-3 pb-4">
                <button type="button" disabled={!meta.has_prev || loading} onClick={() => changePage(Math.max(1, page - 1))} className={`rounded-lg border px-4 py-2 disabled:opacity-40 ${panel}`}>Previous</button>
                <span className={muted}>Page {meta.page || page} of {meta.pages || 1}</span>
                <button type="button" disabled={!meta.has_next || loading} onClick={() => changePage(page + 1)} className={`rounded-lg border px-4 py-2 disabled:opacity-40 ${panel}`}>Next</button>
            </div>}
        </div>
    </div>
}
