import { useEffect, useState } from 'react'
import { HOT_GAME_ARTWORK } from '@/lib/hot-games'
import { HOT_CATALOGUE_PATH, newCatalogueCache, preloadNewHomeCatalogues } from '@/lib/new-catalogue'

const RETRY_DELAY = 3000
const MAX_RETRIES = 5

// A few hot titles come back without provider artwork; use our bundled icon.
function withHotArtwork(game) {
    if (game.img) return game
    return { ...game, img: HOT_GAME_ARTWORK[game.name.trim().toLowerCase()] || '' }
}

// The curated Hot list from the backend. While 9W is still warming its
// catalogue the API answers with `loading`, so retry a few times.
export default function useHotGames() {
    const cached = newCatalogueCache.get(HOT_CATALOGUE_PATH)
    const [games, setGames] = useState(() => (cached?.games || []).map(withHotArtwork))
    const [loading, setLoading] = useState(!cached?.games?.length)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        let timer
        const load = async (attempt) => {
            const [result] = await preloadNewHomeCatalogues({ paths: [HOT_CATALOGUE_PATH] })
            if (!active) return
            const catalogue = result.status === 'fulfilled' ? result.value : null
            if (catalogue?.games?.length) setGames(catalogue.games.map(withHotArtwork))
            if (catalogue?.timestamp || attempt >= MAX_RETRIES) {
                setLoading(false)
                if (!catalogue?.games?.length) setError(result.reason?.message || 'Hot games are unavailable right now.')
                return
            }
            timer = setTimeout(() => load(attempt + 1), RETRY_DELAY)
        }
        load(0)
        return () => {
            active = false
            clearTimeout(timer)
        }
    }, [])

    return { games, loading, error }
}
