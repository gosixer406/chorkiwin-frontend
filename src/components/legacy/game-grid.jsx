import { useEffect, useMemo, useState } from 'react'
import GameCard from '@/components/game-card'
import useGameLauncher from '@/hooks/use-game-launcher'
import {
    legacyCatalogueCache,
    legacyCatalogueMetaCache,
    legacyCataloguePath,
    loadLegacyCasinoCatalogue,
} from '@/lib/legacy-catalogue'
import {
    availableReferenceProviders,
    normalizedReferenceKey,
    referenceProviderMatches,
} from '@/lib/reference-games'

function mergeGames(current, incoming) {
    const rows = new Map(current.map((game) => [game.uid, game]))
    incoming.forEach((game) => rows.set(game.uid, game))
    return [...rows.values()]
}

export default function LegacyGameGrid({
    items = [],
    category = '',
    referenceCategory = '',
    referenceGroup = '',
    provider = '',
    sort = 'Latest',
    searchable = false,
    maxItems = 0,
    className = 'grid grid-cols-3 gap-2',
    cardClassName = 'aspect-square',
}) {
    const path = useMemo(
        () => legacyCataloguePath(category, referenceCategory, {
            provider,
            group: referenceGroup,
            limit: maxItems > 0 ? Math.min(40, maxItems) : 40,
        }),
        [category, maxItems, provider, referenceCategory, referenceGroup],
    )
    const [games, setGames] = useState(() => legacyCatalogueCache.get(path) || [])
    const [meta, setMeta] = useState(() => legacyCatalogueMetaCache.get(path) || {})
    const [loading, setLoading] = useState(() => !legacyCatalogueCache.has(path))
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const launcher = useGameLauncher()

    const mirroredProviders = useMemo(
        () => availableReferenceProviders(referenceCategory, games),
        [games, referenceCategory],
    )

    const mirroredGames = useMemo(() => {
        if (!referenceCategory) return []
        if (!provider.trim()) return mirroredProviders.flatMap((row) => row.games)
        return mirroredProviders.find((row) => (
            referenceProviderMatches(row.name, provider)
        ))?.games || []
    }, [mirroredProviders, provider, referenceCategory])

    useEffect(() => {
        let active = true
        let retryTimer
        let attempt = 0
        const cachedGames = legacyCatalogueCache.get(path)
        window.queueMicrotask(() => {
            if (!active) return
            setGames(cachedGames || [])
            setMeta(legacyCatalogueMetaCache.get(path) || {})
            setLoading(!cachedGames)
        })

        const load = async () => {
            try {
                const result = await loadLegacyCasinoCatalogue(path)
                if (!active) return
                setGames((current) => result.providerLoading
                    ? mergeGames(current, result.games)
                    : result.games)
                setMeta(result.meta || {})
                setError('')
                if (result.games.length) setLoading(false)
                if (result.providerLoading && attempt < 30) {
                    attempt += 1
                    retryTimer = window.setTimeout(load, 1500)
                    return
                }
                setLoading(false)
            } catch (requestError) {
                if (!active) return
                setError(requestError.message || 'Games are temporarily unavailable.')
                setLoading(false)
            }
        }

        load()

        return () => {
            active = false
            window.clearTimeout(retryTimer)
        }
    }, [path])

    const loadMore = async () => {
        if (loadingMore || !meta.has_next) return
        setLoadingMore(true)
        setError('')
        try {
            const nextPath = legacyCataloguePath(category, referenceCategory, {
                page: Number(meta.page || 1) + 1,
                limit: 40,
                provider,
                group: referenceGroup,
            })
            const result = await loadLegacyCasinoCatalogue(nextPath)
            setGames((current) => mergeGames(current, result.games))
            setMeta(result.meta || {})
        } catch (requestError) {
            setError(requestError.message || 'Unable to load more games.')
        } finally {
            setLoadingMore(false)
        }
    }

    const visibleGames = useMemo(() => {
        const groupQuery = normalizedReferenceKey(referenceGroup)
        const providerQuery = provider.trim().toLowerCase()
        const catalogueGames = referenceCategory ? mirroredGames : games
        let rows = groupQuery
            ? catalogueGames.filter((game) => (
                normalizedReferenceKey(game.referenceGroup) === groupQuery
                || (game.raw?.reference_groups || []).some(
                    (group) => normalizedReferenceKey(group) === groupQuery,
                )
            ))
            : catalogueGames
        rows = providerQuery && !referenceCategory
            ? rows.filter((game) => game.provider.toLowerCase().includes(providerQuery))
            : rows
        if (providerQuery && rows.length === 0 && !referenceCategory) rows = catalogueGames
        const query = search.trim().toLowerCase()
        if (query) rows = rows.filter((game) => `${game.name} ${game.provider}`.toLowerCase().includes(query))
        if (sort.toLowerCase().includes('a-z')) rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
        return rows
    }, [games, mirroredGames, provider, referenceCategory, referenceGroup, search, sort])

    const cards = useMemo(() => {
        const selectedGames = maxItems > 0 ? visibleGames.slice(0, maxItems) : visibleGames
        if (!selectedGames.length) return referenceCategory ? [] : items
        return selectedGames.map((liveGame, index) => {
            const artwork = items[index % Math.max(items.length, 1)] || {}
            return referenceCategory ? liveGame : { ...liveGame, fallbackImg: artwork.img }
        })
    }, [items, maxItems, referenceCategory, visibleGames])

    return (
        <div className="flex flex-col gap-3">
            {searchable && (
                <label className="block">
                    <span className="sr-only">Search games</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search games"
                        className="min-h-11 w-full rounded-lg border border-[#CFDCE4] bg-white px-4 text-sm text-black outline-none focus:border-[#8B6A07]"
                    />
                </label>
            )}
            {(launcher.error || (error && cards.length === 0)) && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{launcher.error || error}</div>}
            {loading && cards.length === 0 && <div className="rounded-lg bg-white p-6 text-center text-sm text-[#657583]">Loading games…</div>}
            {!loading && visibleGames.length === 0 && !error && <div className="rounded-lg bg-white p-6 text-center text-sm text-[#657583]">No games match this selection.</div>}
            <div className={className}>
                {cards.map((item, index) => (
                    <GameCard
                        key={item.referenceId || `${item.uid || 'legacy'}-${index}`}
                        item={item}
                        className={cardClassName}
                        priority={index < 9}
                        onLaunch={item.uid ? () => launcher.launchGame(item) : undefined}
                        launching={launcher.launchingId === item.uid}
                    />
                ))}
            </div>
            {!loading && maxItems <= 0 && meta.has_next && (
                <button type="button" onClick={loadMore} disabled={loadingMore} className="mx-auto rounded border border-[#c99a00] px-4 py-2 text-sm font-semibold text-[#8b6a07] disabled:opacity-60">
                    {loadingMore ? 'Loading…' : 'Load More'}
                </button>
            )}
        </div>
    )
}
