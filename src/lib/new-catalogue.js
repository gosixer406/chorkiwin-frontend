import { api } from '@/lib/api'
import { referenceFallbackPath } from '@/lib/catalogue-fallback'
import { normalizeGame } from '@/lib/games'
import { withLightReferenceImage } from '@/lib/reference-games'

export const newCatalogueCache = new Map()
const pendingCatalogues = new Map()

// First pages are kept in localStorage so a returning visitor's home page
// paints from the last good response at once; a refresh then runs behind it.
const PERSIST_KEY = 'velki_home_catalogues_v1'
const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000
const STALE_AFTER = 5 * 60 * 1000
const PERSIST_MAX_CHARS = 1_000_000

function readPersisted() {
    try {
        return JSON.parse(localStorage.getItem(PERSIST_KEY) || 'null') || {}
    } catch {
        return {}
    }
}

function persist(requestPath, response) {
    try {
        const stored = readPersisted()
        stored[requestPath] = { data: response.data, meta: response.meta || {}, timestamp: Date.now() }
        const value = JSON.stringify(stored)
        // Leave room in the ~5MB quota for the login session and other keys.
        if (value.length > PERSIST_MAX_CHARS) {
            localStorage.removeItem(PERSIST_KEY)
            return
        }
        localStorage.setItem(PERSIST_KEY, value)
    } catch {
        // Storage full or blocked: the in-memory cache still works.
    }
}

const firstPagePath = (category) => (
    `/api/9w/games/reference?theme=dark&category=${category}&limit=40&page=1`
)

// The curated Hot list is short (~40 games), so it is loaded in one page.
export const HOT_CATALOGUE_PATH = '/api/9w/games/reference?theme=dark&category=hot&limit=100&page=1'

// Warm only page one for every dark-mode category. This keeps category taps
// instant without downloading the complete multi-megabyte catalogue.
const firstLoadDarkCatalogues = [
    ...['live', 'slots', 'table', 'crash', 'fishing', 'arcade', 'lottery'].map(firstPagePath),
    HOT_CATALOGUE_PATH,
]

// Home tabs live at clean paths (/casino, /slots, ...). The old ?category=
// codes still map onto them so bookmarks keep working.
export const HOME_TAB_CODES = {
    HT: 'popular', SB: 'sports', LC: 'casino', SL: 'slots', CB: 'table', CR: 'crash', FH: 'fishing', AR: 'arcade', LK: 'lottery',
}
export const HOME_TAB_PATHS = new Set(Object.values(HOME_TAB_CODES))

// The catalogue each home tab shows first.
const homeTabCatalogues = {
    casino: 'live', slots: 'slots', table: 'table', crash: 'crash', fishing: 'fishing', arcade: 'arcade', lottery: 'lottery',
}

// The catalogue the first screen needs, or null when the landing page shows
// none (sports tab — the default —, popular tab, dashboard, auth, ...).
export function landingCataloguePath({ pathname, search }) {
    const slug = pathname === '/'
        ? HOME_TAB_CODES[String(new URLSearchParams(search).get('category') || '').toUpperCase()]
        : pathname.slice(1).toLowerCase()
    return homeTabCatalogues[slug] ? firstPagePath(homeTabCatalogues[slug]) : null
}

// A startup preload still in flight for this path, so a section can reuse it
// instead of sending the same (sometimes very slow) request again.
export function pendingNewCatalogue(requestPath) {
    return pendingCatalogues.get(requestPath)
}

function normalizeRows(response) {
    return (Array.isArray(response.data) ? response.data : [])
        .map(normalizeGame)
        .map(withLightReferenceImage)
        .filter((game) => game.uid)
}

Object.entries(readPersisted()).forEach(([requestPath, entry]) => {
    if (!entry?.timestamp || Date.now() - entry.timestamp > PERSIST_MAX_AGE) return
    const games = normalizeRows(entry)
    if (games.length) newCatalogueCache.set(requestPath, { games, meta: entry.meta || {}, timestamp: entry.timestamp })
})

function preloadCataloguePath(requestPath) {
    const cached = newCatalogueCache.get(requestPath)
    if (cached) {
        // Serve the saved page now; refresh a stale one in the background.
        if (Date.now() - cached.timestamp > STALE_AFTER && !pendingCatalogues.has(requestPath)) {
            pendingCatalogues.set(requestPath, fetchCataloguePath(requestPath)
                .catch(() => cached)
                .finally(() => pendingCatalogues.delete(requestPath)))
        }
        return Promise.resolve(cached)
    }
    if (!pendingCatalogues.has(requestPath)) {
        pendingCatalogues.set(requestPath, fetchCataloguePath(requestPath)
            .finally(() => pendingCatalogues.delete(requestPath)))
    }
    return pendingCatalogues.get(requestPath)
}

async function fetchCataloguePath(requestPath) {
    let response = await api.get(requestPath)
    let rows = normalizeRows(response)
    const fallbackPath = referenceFallbackPath(requestPath)
    if (!rows.length && !response.meta?.loading && fallbackPath) {
        response = await api.get(fallbackPath)
        rows = normalizeRows(response)
    }
    if (!response.meta?.loading) {
        const cached = { games: rows, meta: response.meta || {}, timestamp: Date.now() }
        newCatalogueCache.set(requestPath, cached)
        if (rows.length) persist(requestPath, response)
        return cached
    }
    return { games: rows, timestamp: 0 }
}

export async function preloadNewHomeCatalogues({ strict = false, paths = firstLoadDarkCatalogues } = {}) {
    const requests = paths.map(preloadCataloguePath)
    if (!strict) return Promise.allSettled(requests)

    const catalogues = await Promise.all(requests)
    if (catalogues.some((catalogue) => !catalogue?.timestamp)) {
        throw new Error('Games are still loading')
    }
    return catalogues
}
