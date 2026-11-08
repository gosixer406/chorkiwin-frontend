import { useCallback, useEffect, useState } from 'react'
import { requestAccountRefresh } from '@/lib/refresh-account'
import { Crown, Trophy } from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import { api } from '@/lib/api'

function SectionTitle({ children }) {
    return (
        <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-[13px] w-1 rounded-full bg-gold" />
            <h3 className="font-inter text-[13px] font-medium leading-5 text-white">{children}</h3>
        </div>
    )
}

export default function VipClub() {
    const [vip, setVip] = useState(null)
    const [history, setHistory] = useState([])
    const [points, setPoints] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        try {
            const [statusResponse, historyResponse] = await Promise.all([api.get('/api/vip/status'), api.get('/api/vip/history?limit=30')])
            setVip(statusResponse.data)
            setHistory(historyResponse.data || [])
        } catch (requestError) { setError(requestError.message) }
    }, [])
    useEffect(() => { load() }, [load])

    async function convert(event) {
        event.preventDefault()
        setError('')
        try {
            const response = await api.post('/api/vip/convert', { points: Number(points) })
            setMessage(response.message || 'VIP points converted')
            setPoints('')
            requestAccountRefresh()
            await load()
        } catch (requestError) { setError(requestError.message) }
    }

    const progress = Math.min(100, Number(vip?.progress_pct || 0))

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <header className="sticky top-0 z-20 bg-bar">
                <PageTitle title="VIP Club" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-bar px-3! text-ink" />
            </header>

            <div className="flex flex-col gap-4 px-2.5 py-3 text-white">
                {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
                {message && <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
                {!vip && !error && <p className="py-16 text-center text-[13px] text-ink-muted">Loading VIP status…</p>}

                {vip && <>
                    <section className="overflow-hidden rounded-md border border-line">
                        <div className="bg-linear-to-r from-(--menu-banner-from) via-(--menu-banner-via) to-(--menu-banner-to) px-3.5 py-3 text-white">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[12px] font-medium text-(--menu-banner-sub)">Current Level</p>
                                    <h2 className="mt-0.5 flex items-center gap-1.5 font-poppins text-[20px] font-bold leading-tight text-white"><Crown className="size-5" strokeWidth={2} />{vip.name}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] font-medium text-(--menu-banner-sub)">VIP Points</p>
                                    <div className="mt-1 inline-flex h-[30px] items-center gap-1 rounded-full bg-[#1E1606]/80 px-3 text-sm font-semibold text-gold-light">
                                        <Trophy className="size-4" strokeWidth={2} />{Number(vip.points || 0).toFixed(0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface px-3.5 pb-3 pt-3">
                            <div className="h-1.5 overflow-hidden rounded-full bg-page">
                                <div className="h-full rounded-full bg-linear-to-r from-gold-light to-gold-dark" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-medium uppercase text-gold">{vip.name}</span>
                                <span className="text-ink-soft">{vip.next_level ? `${Number(vip.next_level.remaining_points || 0).toFixed(0)} points to ${vip.next_level.name}` : 'Highest level reached'}</span>
                                {vip.next_level && <span className="font-medium uppercase text-ink-soft">{vip.next_level.name}</span>}
                            </div>
                        </div>
                    </section>

                    {vip.vp_convert_enabled && (
                        <form onSubmit={convert}>
                            <SectionTitle>Convert VIP Points</SectionTitle>
                            <div className="flex gap-2">
                                <input
                                    required
                                    min={1}
                                    value={points}
                                    onChange={(event) => setPoints(event.target.value)}
                                    type="number"
                                    inputMode="numeric"
                                    aria-label="VIP points to convert"
                                    placeholder="Enter points"
                                    className="h-[38px] min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-[13px] text-white outline-none placeholder:text-ink-muted focus:border-gold"
                                />
                                <button className="h-[38px] shrink-0 rounded-[3px] bg-gold px-4 text-[13px] font-semibold text-on-gold">Convert</button>
                            </div>
                            <p className="mt-1.5 text-[11px] text-ink-muted">Converted points are added to your main balance.</p>
                        </form>
                    )}

                    <section>
                        <SectionTitle>Points History</SectionTitle>
                        <div className="overflow-hidden rounded-md border border-line bg-surface">
                            {history.map((row) => (
                                <div key={row.id} className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 text-[12px] last:border-b-0">
                                    <div className="min-w-0">
                                        <p className="truncate text-white">{row.description || row.source}</p>
                                        {row.created_at && <p className="mt-0.5 text-[10px] text-ink-muted">{new Date(row.created_at).toLocaleString('en-GB')}</p>}
                                    </div>
                                    <strong className={`shrink-0 ${Number(row.delta) >= 0 ? 'text-[#00C21A]' : 'text-[#FF3B3B]'}`}>{Number(row.delta) >= 0 ? '+' : ''}{Number(row.delta).toFixed(0)} VP</strong>
                                </div>
                            ))}
                            {history.length === 0 && <p className="py-10 text-center text-[12px] text-ink-muted">No VIP point history yet.</p>}
                        </div>
                    </section>
                </>}
            </div>
        </div>
    )
}
