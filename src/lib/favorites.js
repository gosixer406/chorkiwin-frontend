import { withLightReferenceImage } from '@/lib/reference-games'

const FAVORITES_KEY = 'velki_favorite_games'

export function readFavorites() {
    try {
        const rows = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
        return Array.isArray(rows) ? rows.map(withLightReferenceImage) : []
    } catch {
        return []
    }
}

export function isFavorite(uid) {
    return readFavorites().some((game) => game.uid === uid)
}

export function toggleFavorite(game) {
    const favorites = readFavorites()
    const exists = favorites.some((item) => item.uid === game.uid)
    const next = exists
        ? favorites.filter((item) => item.uid !== game.uid)
        : [game, ...favorites].slice(0, 100)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('velki:favorites-changed', { detail: next }))
    return !exists
}
