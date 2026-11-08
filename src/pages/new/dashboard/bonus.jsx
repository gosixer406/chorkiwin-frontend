import { useCallback, useEffect, useState } from 'react'
import { requestAccountRefresh } from '@/lib/refresh-account'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

export default function Bonus() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [claiming, setClaiming] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await api.get('/api/bonus/my-bonuses')
            setRows(response.data || [])
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    async function claim(row) {
        setClaiming(row.id)
        setError('')
        try {
            const response = await api.post(`/api/bonus/my-bonuses/${row.id}/claim`, {})
            setMessage(response.message || 'Promotion claimed')
            requestAccountRefresh()
            await load()
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setClaiming('')
        }
    }

    return <>
        <PageTitle title="Bonus" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-bar px-3! text-ink" />
        <div className="space-y-3 p-3 text-white">
            {message && <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            {loading && <p className="py-12 text-center text-ink-muted">Loading bonuses…</p>}
            {!loading && rows.length === 0 && <p className="py-12 text-center text-ink-muted">No bonus records found.</p>}
            {rows.map((row) => <article key={row.id} className="rounded-md border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3"><div><strong>{row.title || 'Promotion bonus'}</strong><p className="mt-1 text-xs text-ink-soft">{row.description}</p></div><span className="rounded-full bg-black/20 px-3 py-1 text-xs capitalize text-gold-light">{row.status}</span></div>
                <p className="mt-3 text-sm">Bonus: USD {Number(row.amount || row.bonus_amount || 0).toFixed(2)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-strong"><div className="h-full bg-primary2" style={{ width: `${Math.min(100, Number(row.overall_progress_pct || 0))}%` }} /></div>
                <div className="mt-1 flex justify-between text-xs text-ink-soft"><span>Turnover progress</span><span>{Number(row.overall_progress_pct || 0).toFixed(0)}%</span></div>
                {row.can_claim && <button disabled={claiming === row.id} onClick={() => claim(row)} className="btn-new mt-4 w-full py-2 disabled:opacity-50">{claiming === row.id ? 'Claiming…' : 'Claim bonus'}</button>}
            </article>)}
        </div>
    </>
}
