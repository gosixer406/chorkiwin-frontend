import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

const money = (value) => `USD ${Number(value || 0).toFixed(2)}`

export default function Transaction() {
    const [tab, setTab] = useState('payments')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get('/api/wallet/transactions?limit=100')
            .then((response) => active && setRows(response.data || []))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [])

    const shown = rows.filter((row) => {
        const type = String(row.type || '').toLowerCase()
        const description = String(row.description || '').toLowerCase()
        const kind = String(row.metadata_json?.kind || '').toLowerCase()
        const p2p = kind.includes('p2p') || type.includes('p2p') || description.includes('p2p')
        const payment = ['deposit', 'withdraw', 'payment'].some((value) => type.includes(value) || kind.includes(value) || description.includes(value))
        return tab === 'p2p' ? p2p : payment && !p2p
    })

    return <>
        <PageTitle title="Payment Transfer Log" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        <div className="grid grid-cols-2 bg-account-header" role="tablist" aria-label="Transaction log tabs">
            {[['payments', 'Payment Transfer Log'], ['p2p', 'P2p Log']].map(([value, label]) => <button role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)} className={`h-10 border-b-2 py-2.5 text-sm font-medium ${tab === value ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}>{label}</button>)}
        </div>
        <div className="space-y-2 px-2 py-4 text-white">
            {loading && <Loader />}
            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            {!loading && !error && shown.length === 0 && <p className="py-12 text-center text-ink-muted">No transaction records found.</p>}
            {shown.map((row) => <article key={row.id} className="rounded-md border border-line bg-surface p-4 text-sm">
                <div className="flex justify-between gap-3"><strong className="capitalize">{String(row.type || 'transaction').replaceAll('_', ' ')}</strong><span className="capitalize text-gold-light">{row.status}</span></div>
                <p className="mt-1 text-xs text-ink-soft">{row.description || row.reference_id || 'Wallet transaction'}</p>
                <div className="mt-2 flex justify-between text-xs"><span>{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</span><strong className={Number(row.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{money(row.amount)}</strong></div>
            </article>)}
        </div>
    </>
}
