import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

export default function Cashback() {
    const wallet = useSelector((state) => state.auth.user?.wallet) || {}
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const currency = 'USD'

    useEffect(() => {
        let active = true
        api.get('/api/wallet/transactions?limit=100')
            .then((response) => {
                if (!active) return
                setRows((response.data || []).filter((row) => `${row.type || ''} ${row.description || ''}`.toLowerCase().includes('cashback')))
            })
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [])

    return <>
        <PageTitle title="Cash Back Details" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-bar px-3! text-ink" />
        <section className="space-y-2 px-[13px] py-3" aria-label="Cash back details">
            <div className="rounded-md bg-linear-to-r from-(--menu-banner-from) via-(--menu-banner-via) to-(--menu-banner-to) p-4 text-white">
                <p className="text-xs font-medium text-(--menu-banner-sub)">Cash Back Balance</p>
                <strong className="mt-1 block text-2xl">{currency} {Number(wallet.cashback_balance ?? wallet.cash_back_balance ?? 0).toFixed(2)}</strong>
            </div>
            {loading && <Loader />}
            {error && <div className="rounded-md border border-[#772C2C] bg-[#C52B2B]/10 p-3 text-sm text-[#FF7A84]">{error}</div>}
            {!loading && !error && rows.length === 0 && <p className="py-12 text-center text-ink-muted">No cash back records found.</p>}
            {rows.map((row) => <article key={row.id} className="rounded-md border border-line bg-surface px-3.5 py-3 text-sm text-ink">
                <div className="flex justify-between gap-3"><strong>Cash Back</strong><span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold capitalize text-gold">{row.status || 'completed'}</span></div>
                <p className="mt-1 text-xs text-ink-muted">{row.description || 'Cash back credit'}</p>
                <div className="mt-2 flex justify-between border-t border-line pt-2 text-xs"><span className="text-ink-muted">{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</span><strong className="text-emerald-400">{currency} {Number(row.amount || 0).toFixed(2)}</strong></div>
            </article>)}
        </section>
    </>
}
