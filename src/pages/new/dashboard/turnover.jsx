import { DISPLAY_CURRENCY } from '@/lib/currency'
import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

export default function Turnover() {
    const [tab, setTab] = useState('active')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get('/api/bonus/my-bonuses')
            .then((response) => active && setRows(response.data || []))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [])

    const shown = rows.filter((row) => tab === 'active' ? ['active', 'pending'].includes(row.status) : !['active', 'pending'].includes(row.status))

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <header className="sticky top-0 z-20 bg-account-header">
                <PageTitle title="Turnover" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
                <div className="grid grid-cols-2" role="tablist" aria-label="Turnover tabs">
                    {['active', 'completed'].map((value) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === value}
                            key={value}
                            onClick={() => setTab(value)}
                            className={`h-[38px] border-b-[3px] text-[14px] font-medium capitalize transition-colors ${tab === value ? 'border-white text-white' : 'border-transparent text-white/60'}`}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-2 px-2.5 py-3 text-white">
                {loading && <Loader />}
                {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
                {!loading && !error && shown.length === 0 && <p className="py-20 text-center text-[13px] text-ink-muted">No {tab} turnover found.</p>}
                {shown.map((row) => (
                    <article key={row.id} className="rounded-md border border-line bg-surface p-3 text-sm">
                        <div className="flex justify-between gap-3"><strong className="truncate text-[13px]">{row.title || 'Bonus turnover'}</strong><span className="shrink-0 text-[12px] capitalize text-gold">{row.status}</span></div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-strong"><div className="h-full bg-gold" style={{ width: `${Math.min(100, Number(row.overall_progress_pct || 0))}%` }} /></div>
                        <div className="mt-2 flex justify-between text-[11px] text-ink-muted"><span>Wagered {DISPLAY_CURRENCY} {Number(row.wagered_amount || 0).toFixed(2)}</span><span>Required {DISPLAY_CURRENCY} {Number(row.required_wager || 0).toFixed(2)}</span></div>
                    </article>
                ))}
            </div>
        </div>
    )
}
