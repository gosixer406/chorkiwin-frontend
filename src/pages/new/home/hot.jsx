import Loader from '@/components/loader'
import { useState } from 'react'
import useGameLauncher from '@/hooks/use-game-launcher'
import useHotGames from '@/hooks/use-hot-games'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import GameImage from '@/components/game-image'
import hotIcon from '@/assets/img/new/quick-nav-hd/quick-nav-hot-game.png'
import hot9w from '@/assets/img/hot-games/9-Wickets-(Dark)Yellow.png'
import hotSaba from '@/assets/img/hot-games/Saba-sports-500.jpeg'
import hotBti from '@/assets/img/hot-games/BTI_5000.jpeg'

// chorkiwin: 9Wickets, SABA and BTI always first in the Hot list, in this
// order (static); admin's Hot games follow. (chorki88 keeps only 9Wickets.)
const HOT_SPORTSBOOKS = [
    { code: '9w', name: '9Wickets', img: hot9w },
    { code: 'saba', name: 'SABA Sports', img: hotSaba },
    { code: 'bti', name: 'BTI', img: hotBti },
].map((book) => ({ ...book, uid: `sports-${book.code}`, sportsbook: true }))

function HotGameCard({ game, onLaunch, launching, priority = false }) {
    const [favorite, setFavorite] = useState(() => isFavorite(game.uid))

    const handleFavorite = (event) => {
        event.stopPropagation()
        setFavorite(toggleFavorite({ uid: game.uid, name: game.name, img: game.img, provider: game.provider }))
    }

    return (
        <button
            type="button"
            data-loading={launching}
            onClick={onLaunch}
            className="group relative aspect-square w-[calc((100%-12px)/3)] shrink-0 cursor-pointer overflow-hidden rounded border border-white/60 transition-[border-width] duration-75 ease-linear hover:border-3 focus:outline-none"
            aria-label={game.name}
        >
            <div className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-full rounded-xl bg-black/50 group-data-[loading=true]:block">
                <Loader label="" className="h-full" />
            </div>
            <GameImage
                src={game.img}
                fallback={game.fallbackImg}
                alt={game.name}
                priority={priority}
                className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 flex h-[21.927px] items-center justify-between bg-[rgba(0,0,0,0.6)] px-[4.39px]">
                <span className="flex-1 truncate text-left font-roboto text-xs font-bold leading-none text-ink-soft">{game.name}</span>
                {!game.sportsbook && <span
                    role="button"
                    aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'}
                    aria-pressed={favorite}
                    onClick={handleFavorite}
                    className="-mr-0.5 shrink-0 p-0.5"
                >
                    <svg className="size-4" viewBox="0 0 24 24" fill={favorite ? '#F5F8F9' : 'none'} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M12 21C12 21 3 14.5 3 8.5C3 5.46243 5.46243 3 8.5 3C10.0706 3 11.4722 3.65238 12 4.5C12.5278 3.65238 13.9294 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 14.5 12 21 12 21Z" stroke="#F5F8F9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>}
            </div>
        </button>
    )
}

export default function Hot() {
    const launcher = useGameLauncher()
    const { games: hotGames, loading, error } = useHotGames()
    // 9Wickets, SABA and BTI first (shown at once), then the games admin marked
    // Hot (Game Catalog > Hot Games) in admin's order as they arrive from the API.
    const games = [...HOT_SPORTSBOOKS, ...hotGames]
    const rows = []
    for (let index = 0; index < games.length; index += 3) rows.push(games.slice(index, index + 3))

    const launch = (game) => {
        if (game.sportsbook) return launcher.launchSportsbook(game.code, game.name)
        launcher.launchGame({ uid: game.uid, name: game.name, img: game.img, provider: game.provider })
    }

    return (
        <section className="flex flex-col gap-2.5" aria-label="Hot Game">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                    <img src={hotIcon} alt="" aria-hidden="true" className="size-4 shrink-0 object-cover" />
                    <span className="whitespace-nowrap font-roboto text-[14px] font-semibold uppercase leading-none text-primary2">Hot Game</span>
                </div>
                <div className="h-0.75 w-21 rounded-full bg-[linear-gradient(90deg,var(--c-gold)_0%,var(--c-gold)_39%,color-mix(in_srgb,var(--c-gold)_0%,transparent)_100%)]" />
            </div>
            {(launcher.error || error) && (
                <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">{launcher.error || error}</div>
            )}
            <div className="flex flex-col gap-1.5">
                {loading && !hotGames.length && <Loader />}
                {rows.map((row, index) => (
                    <div key={index} className="flex gap-1.5">
                        {row.map((game) => (
                            <HotGameCard
                                key={game.uid}
                                game={game}
                                priority={index < 3}
                                onLaunch={() => launch(game)}
                                launching={launcher.launchingId === game.uid}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {!loading && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-[10px] font-light text-ink-soft">- end of list -</p>
                </div>
            )}
        </section>
    )
}
