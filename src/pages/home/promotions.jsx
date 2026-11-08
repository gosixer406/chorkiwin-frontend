import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft } from 'lucide-react'
import { api, apiAssetUrl } from '@/lib/api'

export default function LegacyPromotions() {
    const { promotionId } = useParams()
    const navigate = useNavigate()
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const [data, setData] = useState(promotionId ? null : [])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        Promise.resolve().then(() => {
            if (!active) return
            setLoading(true)
            setError('')
        })
        api.get(promotionId ? `/api/promotions/${promotionId}` : '/api/promotions')
            .then((response) => active && setData(response.data))
            .catch((requestError) => active && setError(requestError.message))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [promotionId])

    if (loading) return <div className="grid min-h-70 place-items-center text-[#8B6A07]">Loading promotions…</div>
    if (error) return <div className="p-4"><div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div></div>

    if (!promotionId) {
        return (
            <main className="p-3">
                <div className="mb-4 flex items-center gap-3">
                    <Link to="/" className="grid size-9 place-items-center rounded-full bg-white text-black shadow" aria-label="Back to home"><ArrowLeft className="size-5" /></Link>
                    <h1 className="text-lg font-bold text-[#172033]">Promotions</h1>
                </div>
                {data.length ? <div className="grid grid-cols-1 gap-3">{data.map((promotion) => (
                    <Link key={promotion.id} to={`/promotions/${promotion.id}`} className="overflow-hidden rounded-xl border border-[#DEE7EC] bg-white shadow-sm">
                        {promotion.image_url && <img src={apiAssetUrl(promotion.image_url)} className="aspect-[16/7] w-full object-cover" alt={promotion.title} />}
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-[#172033]">{promotion.title}</h2>{promotion.badge && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-black">{promotion.badge}</span>}</div>
                            <p className="mt-1 text-xs text-[#64748B]">{promotion.subtitle}</p>
                            {promotion.reward && <strong className="mt-2 block text-sm text-[#8B6A07]">{promotion.reward}</strong>}
                        </div>
                    </Link>
                ))}</div> : <div className="rounded-xl bg-white p-10 text-center text-[#64748B]">No active promotions right now.</div>}
            </main>
        )
    }

    const promotion = data
    const choosePromotion = () => {
        if (!isLoggedIn) {
            navigate(`/login?returnTo=${encodeURIComponent(`/promotions/${promotion.id}`)}`)
            return
        }
        navigate(`/dashboard/deposit?deposit&promotion=${encodeURIComponent(promotion.id)}`)
    }

    return (
        <main className="pb-10">
            <div className="flex items-center gap-3 bg-primary p-3"><Link to="/promotions" className="grid size-9 place-items-center rounded-full bg-black/10 text-black" aria-label="Back to promotions"><ArrowLeft className="size-5" /></Link><h1 className="text-lg font-bold text-black">Promotion details</h1></div>
            {(promotion.detail_banner_url || promotion.image_url) && <img src={apiAssetUrl(promotion.detail_banner_url || promotion.image_url)} className="w-full object-cover" alt={promotion.title} />}
            <article className="bg-white p-4 text-[#334155]">
                <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold text-[#172033]">{promotion.title}</h2>{promotion.badge && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-black">{promotion.badge}</span>}</div>
                <p className="mt-2 text-sm text-[#64748B]">{promotion.subtitle}</p>
                {promotion.reward && <strong className="mt-3 block text-lg text-[#8B6A07]">{promotion.reward}</strong>}
                {promotion.detail_html && <div className="promotion-content mt-5 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: promotion.detail_html }} />}
                {promotion.user_registered ? <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">This promotion is already active on your account.</div> : (promotion.deposit_selectable || promotion.auto_start_on_registration) ? <button type="button" onClick={choosePromotion} className="btn mt-6 min-h-12 w-full bg-primary text-base font-semibold text-black">{promotion.deposit_selectable ? 'Select offer and deposit' : isLoggedIn ? 'View banking' : 'Sign up to activate'}</button> : null}
            </article>
        </main>
    )
}
