import { useEffect, useState } from 'react'
import { HOT_GAME_ARTWORK } from '@/lib/hot-games'
import { HOT_CATALOGUE_PATH, newCatalogueCache, preloadNewHomeCatalogues } from '@/lib/new-catalogue'

const RETRY_DELAY = 3000
const MAX_RETRIES = 5

// No bundled/static hot icons: only the artwork the API sends is used.
function withHotArtwork(game) {
    return game
}

// Only hot games that actually have artwork are shown; one with no image at all
// (would render a blank placeholder) is dropped from the list.
const hotWithArtwork = (games) => (games || []).map(withHotArtwork).filter((game) => game.img)

// The curated Hot list from the backend. While 9W is still warming its
// catalogue the API answers with `loading`, so retry a few times.
export default function useHotGames() {
    const cached = newCatalogueCache.get(HOT_CATALOGUE_PATH)
    const [games, setGames] = useState(() => hotWithArtwork(cached?.games))
    const [loading, setLoading] = useState(!cached?.games?.length)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        let timer
        const load = async (attempt) => {
            const [result] = await preloadNewHomeCatalogues({ paths: [HOT_CATALOGUE_PATH] })
            if (!active) return
            const catalogue = result.status === 'fulfilled' ? result.value : null
            if (catalogue?.games?.length) setGames(hotWithArtwork(catalogue.games))
            if (catalogue?.timestamp || attempt >= MAX_RETRIES) {
                setLoading(false)
                // An empty admin Hot list is not an error; a failed request is.
                if (!catalogue?.games?.length && result.status === 'rejected') setError(result.reason?.message || 'Hot games are unavailable right now.')
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
