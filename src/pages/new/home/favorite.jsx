import { useEffect, useState } from 'react'
import GameTitle from '@/components/new/game-title'
import GameCard from '@/components/new/game-card'
import useGameLauncher from '@/hooks/use-game-launcher'
import { readFavorites } from '@/lib/favorites'
import titleIcon from '@/assets/img/new/game/1.png'

export default function Favorite() {
    const [games, setGames] = useState(readFavorites)
    const launcher = useGameLauncher()

    useEffect(() => {
        const update = (event) => setGames(event.detail || readFavorites())
        window.addEventListener('velki:favorites-changed', update)
        return () => window.removeEventListener('velki:favorites-changed', update)
    }, [])

    return (
        <section className="flex flex-col gap-y-3">
            <GameTitle icon={<img src={titleIcon} className="w-5.5 h-5" alt="" />} title="Favorites" />
            {launcher.error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-200">{launcher.error}</div>}
            {games.length ? (
                <div className="grid grid-cols-3 gap-1.5">
                    {games.map((game) => (
                        <GameCard
                            key={game.uid}
                            item={game}
                            onLaunch={() => launcher.launchGame(game)}
                            launching={launcher.launchingId === game.uid}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-sm text-ink-muted">
                    Tap the heart on any game to keep it here.
                </div>
            )}
        </section>
    )
}
