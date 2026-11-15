import { useState } from 'react'
import poster from '../../assets/img/new/game/poster.png'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import GameImage from '@/components/game-image'

export default function GameCard({ item, onLaunch, launching = false, priority = false }) {
    const [favorite, setFavorite] = useState(() => isFavorite(item.uid))

    const handleFavorite = (event) => {
        event.stopPropagation()
        setFavorite(toggleFavorite(item))
    }

    return (
        <article className="group relative z-1 block aspect-square w-full overflow-hidden rounded-[4px] border border-white/60 bg-surface transition-[border-width] duration-75 hover:border-[3px]">
            <button
                type="button"
                onClick={onLaunch}
                disabled={launching || !onLaunch}
                className="block aspect-square w-full overflow-hidden disabled:cursor-wait"
                aria-label={item.name}
            >
                <GameImage
                    src={item.img}
                    fallback={item.fallbackImg}
                    placeholder={poster}
                    alt={item.name}
                    priority={priority}
                    className="block size-full object-cover transition-all duration-300 group-hover:scale-102 group-hover:opacity-95"
                />
            </button>
            <div className="absolute bottom-0 left-0 flex min-h-5 w-full items-center justify-between gap-1 bg-black/75 px-1 py-0.5">
                <button type="button" onClick={onLaunch} className="min-w-0 truncate text-left text-[11px] leading-none font-bold text-ink-soft capitalize">
                    {item.name}
                </button>
                <button
                    type="button"
                    onClick={handleFavorite}
                    className={favorite ? 'text-red-400' : 'text-[#F5F8F9] hover:text-primary2'}
                    aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                    title={favorite ? 'Remove favorite' : 'Add favorite'}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill={favorite ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.54.91C1.77 1.2.46 2.45.07 4.21-.18 5.4.15 6.45.74 7.53c.3.54 3.07 3.3 5.52 5.41.27.13.46.17.74.17.43 0 .78-.13 1.12-.43 2.36-2.17 5.45-4.93 5.81-6.77.26-1.35-.04-2.72-.96-3.64A4.25 4.25 0 0 0 9.04.94 4.5 4.5 0 0 0 7 1.95 4.56 4.56 0 0 0 3.54.91Z" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                </button>
            </div>
        </article>
    )
}
