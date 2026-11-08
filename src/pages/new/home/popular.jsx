import { lazy, Suspense, useState } from 'react';

import cate_1 from '@/assets/img/new/quick-nav-hd/quick-nav-hot-game.png'
import cate_2 from '@/assets/img/new/quick-nav-hd/quick-nav-favourite.png'
import cate_3 from '@/assets/img/new/quick-nav-hd/quick-nav-promotion.png'

const Hot = lazy(() => import('./hot'))
const Favorite = lazy(() => import('./favorite'))
const Promotion = lazy(() => import('./promotion'))

export default function Popular() {
    const category = [
        {
            img: cate_1,
            name: 'HOT GAME',
            bg: 'linear-gradient(90deg, #3A3A3A 0%, #5A7242 100%)',
            component: <Hot />
        },
        {
            img: cate_2,
            name: 'FAVOURITE',
            bg: 'linear-gradient(90deg, #353430 0%, #615034 100%)',
            component: <Favorite />
        },
        {
            img: cate_3,
            name: 'PROMOTION',
            bg: 'linear-gradient(90deg, #343436 0%, #514668 100%)',
            component: <Promotion />
        },
    ]
    const [active_cate, set_active_cate] = useState(category[0]);

    return (
        <section className="flex flex-col gap-3" aria-label="Exclusive games">
            <div className="flex items-stretch gap-1.5" role="tablist" aria-label="Exclusive categories">
                {category.map((item, idx) => (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={active_cate.name === item.name}
                        onClick={() => set_active_cate(item)}
                        className={`group flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-[6px] pb-2 pt-1 transition-all duration-500 hover:brightness-110 focus:outline-none ${active_cate.name === item.name ? 'brightness-110' : ''}`}
                        style={{ background: item.bg }}
                        key={idx}
                    >
                        <img src={item.img} className={`pointer-events-none h-10 w-10 object-contain transition-transform duration-300 group-hover:rotate-y-180 group-hover:scale-200 ${active_cate.name === item.name ? 'rotate-y-180 scale-200' : ''}`} alt="" />
                        <span className={`uppercase text-xs font-bold leading-[140%] text-ink-muted ${active_cate.name === item.name ? 'hidden' : 'block'}`}>{item.name}</span>
                    </button>
                ))}
            </div>
            <div key={active_cate.name} className="min-h-[96px]">
                <Suspense fallback={<div className="min-h-48 rounded-lg border border-line bg-surface p-6 text-center text-sm text-ink-muted">Preparing games…</div>}>
                    {active_cate.component}
                </Suspense>
            </div>
        </section>
    )
}
