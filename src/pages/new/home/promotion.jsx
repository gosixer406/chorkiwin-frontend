import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GameTitle from '@/components/new/game-title'
import { api, apiAssetUrl } from '@/lib/api'
import titleIcon from '@/assets/img/new/game/2.png'

export default function Promotion() {
    const [promotions, setPromotions] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get('/api/promotions')
            .then((response) => active && setPromotions((response.data || []).slice(0, 6)))
            .catch((requestError) => active && setError(requestError.message))
        return () => { active = false }
    }, [])

    return (
        <section className="flex flex-col gap-y-3">
            <GameTitle icon={<img src={titleIcon} className="w-5.5 h-5" alt="" />} title="Promotions" />
            {error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
            {promotions.length ? (
                <div className="grid grid-cols-1 gap-2">
                    {promotions.map((promotion) => (
                        <Link key={promotion.id} to={`/promotions/${promotion.id}`} className="overflow-hidden rounded-md border border-line bg-surface">
                            {promotion.image_url && <img src={apiAssetUrl(promotion.image_url)} className="aspect-[16/7] w-full object-cover" alt={promotion.title} />}
                            <div className="p-2">
                                <strong className="block truncate text-xs text-white" title={promotion.title}>{promotion.title}</strong>
                                <span className="mt-1 block text-[10px] text-primary2">{promotion.reward || promotion.badge || 'View offer'}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : !error && <div className="rounded-md border border-line bg-surface p-6 text-center text-sm text-ink-muted">No active promotions right now.</div>}
            <Link to="/promotions" className="btn-new mx-auto min-h-10 px-6">View all promotions</Link>
        </section>
    )
}
