import Loader from '@/components/loader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
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
    referenceProviderMatches,
} from '@/lib/reference-games'

function mergeGames(current, incoming) {
    const rows = new Map(current.map((game) => [game.uid, game]))
    incoming.forEach((game) => rows.set(game.uid, game))
    return [...rows.values()]
}

function useAvailableGames(category, provider = '') {
    const path = useMemo(
        () => legacyCataloguePath('', category, { provider, limit: 40 }),
        [category, provider],
    )
    const [games, setGames] = useState(() => legacyCatalogueCache.get(path) || [])
    const [meta, setMeta] = useState(() => legacyCatalogueMetaCache.get(path) || {})
    const [loading, setLoading] = useState(() => !legacyCatalogueCache.has(path))
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState('')

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
            setLoadingMore(false)
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
            const nextPath = legacyCataloguePath('', category, {
                page: Number(meta.page || 1) + 1,
                provider,
                limit: 40,
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

    return { games, meta, loading, loadingMore, error, loadMore }
}

function SearchDrawer({ games, launcher, onClose }) {
    const [query, setQuery] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
        document.body.classList.add('overflow-hidden')
        return () => document.body.classList.remove('overflow-hidden')
    }, [])

    const results = useMemo(() => {
        const value = query.trim().toLowerCase()
        if (!value) return []
        return games.filter((game) => (
            `${game.name} ${game.provider}`.toLowerCase().includes(value)
        ))
    }, [games, query])

    return createPortal(
        <>
            <button
                type="button"
                aria-label="Close search"
                className="fixed inset-0 z-40 cursor-default bg-black/65"
                onClick={onClose}
            />
            <section
                role="dialog"
                aria-modal="true"
                aria-label="Search games"
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[80dvh] w-full max-w-[480px] flex-col overflow-hidden bg-[#f5f8f9]"
            >
                <div className="h-3 flex-none" />
                <div className="relative border-b border-gray-200 px-4 py-2 md:px-6 md:py-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search platform, games, and more..."
                        className="w-full bg-transparent pr-10 text-lg text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        aria-label="Close search"
                        onClick={onClose}
                        className="absolute right-5 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-gray-800"
                    >
                        <X className="size-6" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="reference-search-scroll min-h-0 flex-1 overflow-y-auto">
                    {!query.trim() && (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-5 px-6 text-center text-gray-400">
                            <Search className="size-12 text-[#e1e9ee]" strokeWidth={2} />
                            <p className="text-base">Type to search exactly what you're looking for.</p>
                        </div>
                    )}
                    {query.trim() && results.length === 0 && (
                        <p className="px-6 py-12 text-center text-sm text-gray-500">No matching games found.</p>
                    )}
                    {results.length > 0 && (
                        <div className="px-6 pt-6">
                            <div className="grid grid-cols-2 gap-3 pb-10 md:gap-4">
                                {results.map((game, index) => (
                                    <GameCard
                                        key={game.referenceId}
                                        item={game}
                                        priority={index < 4}
                                        onLaunch={() => launcher.launchGame(game)}
                                        launching={launcher.launchingId === game.uid}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>,
        document.body,
    )
}

function GamesGrid({ games, launcher, priorityCount = 9 }) {
    return games.map((game, index) => (
        <GameCard
            key={game.referenceId}
            item={game}
            priority={index < priorityCount}
            onLaunch={() => launcher.launchGame(game)}
            launching={launcher.launchingId === game.uid}
        />
    ))
}

export default function CasinoCategoryPage({ category }) {
    const { search: locationSearch } = useLocation()
    const [activeProviderName, setActiveProviderName] = useState('')
    const [sort, setSort] = useState('Latest')
    const [searchOpen, setSearchOpen] = useState(false)
    const providerScrollRef = useRef(null)
    const launcher = useGameLauncher()

    const preferredProvider = useMemo(
        () => new URLSearchParams(locationSearch).get('provider') || '',
        [locationSearch],
    )
    const requestedProvider = activeProviderName || preferredProvider
    const {
        games: apiGames,
        meta,
        loading,
        loadingMore,
        error,
        loadMore,
    } = useAvailableGames(category, requestedProvider)
    const providers = useMemo(() => {
        const grouped = availableReferenceProviders(category, apiGames)
        const metadataNames = (Array.isArray(meta.providers) ? meta.providers : [])
            .map((row) => typeof row === 'string' ? row : row?.name)
            .filter(Boolean)
        if (!metadataNames.length) return grouped
        return metadataNames.map((name) => {
            const available = grouped.find((row) => referenceProviderMatches(row.name, name))
            return {
                name,
                games: available?.games?.length
                    ? available.games
                    : requestedProvider && referenceProviderMatches(name, requestedProvider)
                        ? apiGames
                        : [],
            }
        })
    }, [apiGames, category, meta.providers, requestedProvider])

    const selectedProvider = providers.find((provider) => (
        referenceProviderMatches(provider.name, activeProviderName)
    ))
    const preferredAvailableProvider = providers.find((provider) => (
        referenceProviderMatches(provider.name, preferredProvider)
    ))
    const activeProvider = selectedProvider || preferredAvailableProvider || providers[0]

    const displayedGames = useMemo(() => {
        const rows = activeProvider?.games || []
        if (sort !== 'A-Z') return rows
        return [...rows].sort((left, right) => left.name.localeCompare(right.name))
    }, [activeProvider, sort])

    const allAvailableGames = useMemo(
        () => providers.flatMap((provider) => provider.games),
        [providers],
    )

    const groupedGames = useMemo(() => {
        if (category !== 'live') return []
        const groups = new Map()
        displayedGames.forEach((game) => {
            const name = game.referenceGroup || 'Others'
            if (!groups.has(name)) groups.set(name, [])
            groups.get(name).push(game)
        })
        return [...groups.entries()]
    }, [category, displayedGames])

    const statusMessage = error
        ? 'Games are temporarily unavailable.'
        : 'No games from this category are available in the API.'

    return (
        <>
            {providers.length > 0 && (
                <div className="relative w-full bg-[#0b3a55] py-1.5 pl-2">
                    <div
                        ref={providerScrollRef}
                        aria-label={`${providers.length} available providers`}
                        className="flex items-center gap-2 overflow-x-auto scroll-smooth whitespace-nowrap divide-x divide-black/30 pr-12 [scrollbar-width:thin]"
                    >
                        {providers.map((provider) => {
                            const active = referenceProviderMatches(provider.name, activeProvider?.name)
                            return (
                                <button
                                    type="button"
                                    key={provider.name}
                                    onClick={() => setActiveProviderName(provider.name)}
                                    className={`shrink-0 cursor-pointer px-2 py-1 text-sm font-bold whitespace-nowrap transition-all duration-200 ${active ? 'rounded-[3px] bg-[#ffc800] text-black' : 'bg-transparent text-white'}`}
                                >
                                    {provider.name}
                                </button>
                            )
                        })}
                    </div>
                    {providers.length > 4 && (
                        <button
                            type="button"
                            aria-label="Show more providers"
                            onClick={() => providerScrollRef.current?.scrollBy({
                                left: Math.max(180, providerScrollRef.current.clientWidth * 0.75),
                                behavior: 'smooth',
                            })}
                            className="absolute inset-y-0 right-0 grid w-11 place-items-center bg-linear-to-l from-[#0b3a55] via-[#0b3a55] to-transparent text-white"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    )}
                </div>
            )}

            <div className="flex w-full items-center justify-between bg-[#f5f8f9] px-3 py-2">
                <div className="flex items-center">
                    {['Latest', 'A-Z'].map((item, index) => (
                        <div className="flex items-center" key={item}>
                            {index > 0 && <span className="px-1 text-black/30">|</span>}
                            <button
                                type="button"
                                onClick={() => setSort(item)}
                                className={`rounded-full px-3 py-0.5 text-sm font-semibold transition-colors ${sort === item ? 'bg-[#ffc800] text-black' : 'text-gray-900'}`}
                            >
                                {item}
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    aria-label="Search games"
                    onClick={() => setSearchOpen(true)}
                    disabled={!allAvailableGames.length}
                    className="grid size-6 place-items-center text-black disabled:opacity-35"
                >
                    <Search className="size-5" strokeWidth={3.5} />
                </button>
            </div>

            {(launcher.error || (!loading && error)) && (
                <div role="alert" className="mx-2 mb-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {launcher.error || error}
                </div>
            )}

            {displayedGames.length === 0 ? (
                <div className="min-h-52 bg-white p-8 text-center text-sm text-[#657583]">
                    {loading ? <Loader className="py-2" /> : statusMessage}
                </div>
            ) : category === 'live' ? (
                <div className="space-y-6 px-4 py-4">
                    {groupedGames.map(([group, games]) => (
                        <section key={group}>
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold capitalize text-gray-800">{group}</h2>
                            <div className="grid grid-cols-3 gap-2">
                                <GamesGrid games={games} launcher={launcher} />
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-2">
                    <GamesGrid games={displayedGames} launcher={launcher} />
                </div>
            )}

            {!loading && meta.has_next && (
                <div className="flex justify-center bg-[#f5f8f9] py-4">
                    <button type="button" onClick={loadMore} disabled={loadingMore} className="rounded border border-[#c99a00] px-5 py-2 text-sm font-semibold text-[#8b6a07] disabled:opacity-60">
                        {loadingMore ? 'Loading…' : 'Load More'}
                    </button>
                </div>
            )}

            {searchOpen && (
                <SearchDrawer
                    games={allAvailableGames}
                    launcher={launcher}
                    onClose={() => setSearchOpen(false)}
                />
            )}
        </>
    )
}
