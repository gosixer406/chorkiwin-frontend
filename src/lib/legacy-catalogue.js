import { api } from '@/lib/api'
import { referenceFallbackPath } from '@/lib/catalogue-fallback'
import { normalizeGame } from '@/lib/games'

export const legacyCatalogueCache = new Map()
export const legacyCatalogueMetaCache = new Map()
const catalogueRequests = new Map()
const lightReferenceCategories = ['hot', 'live', 'table', 'slots', 'fishing', 'egame']

export function legacyCataloguePath(category, referenceCategory, {
    page = 1,
    limit = 40,
    provider = '',
    group = '',
    search = '',
} = {}) {
    if (referenceCategory) {
        const params = new URLSearchParams({
            theme: 'light',
            category: referenceCategory,
            limit: String(limit),
            page: String(page),
        })
        if (provider) params.set('provider', provider)
        if (group) params.set('group', group)
        if (search) params.set('search', search)
        return `/api/9w/games/reference?${params.toString()}`
    }
    const params = new URLSearchParams({ limit: String(limit), page: String(page) })
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    return `/api/9w/games/all?${params.toString()}`
}

export async function loadLegacyCasinoCatalogue(path) {
    if (legacyCatalogueCache.has(path)) {
        return {
            games: legacyCatalogueCache.get(path),
            meta: legacyCatalogueMetaCache.get(path) || {},
            providerLoading: false,
        }
    }
    if (!catalogueRequests.has(path)) {
        catalogueRequests.set(path, api.get(path).then(async (initialResponse) => {
            let response = initialResponse
            let games = (Array.isArray(response.data) ? response.data : [])
                .map(normalizeGame)
                .filter((game) => game.uid)
            const fallbackPath = referenceFallbackPath(path)
            if (!games.length && !response.meta?.loading && fallbackPath) {
                response = await api.get(fallbackPath)
                games = (Array.isArray(response.data) ? response.data : [])
                    .map(normalizeGame)
                    .filter((game) => game.uid)
            }
            // A loading response can contain only the first supplier(s). Do not
            // freeze that partial list as the completed catalogue.
            if (!response.meta?.loading) {
                legacyCatalogueCache.set(path, games)
                legacyCatalogueMetaCache.set(path, response.meta || {})
            }
            catalogueRequests.delete(path)
            return {
                games,
                meta: response.meta || {},
                providerLoading: Boolean(response.meta?.loading),
            }
        }).catch((error) => {
            catalogueRequests.delete(path)
            throw error
        }))
    }
    return catalogueRequests.get(path)
}

export async function preloadLegacyCasinoCatalogues({ strict = false } = {}) {
    const requests = lightReferenceCategories.map((category) => (
        loadLegacyCasinoCatalogue(legacyCataloguePath('', category))
    ))
    if (!strict) return Promise.allSettled(requests)

    const catalogues = await Promise.all(requests)
    if (catalogues.some((catalogue) => catalogue?.providerLoading)) {
        throw new Error('Games are still loading')
    }
    return catalogues
}
