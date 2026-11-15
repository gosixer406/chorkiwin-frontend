import referenceCatalogue from '@/lib/reference-catalogue.json'
import { featuredGameArtwork } from '@/lib/games'

const providerAliases = {
    DRAGOONSOFT: ['DRAGOONSOFT', 'DRAGOON', 'DS'],
    EVOLUTION: ['EVOLUTION', 'EVO'],
    HOTROAD: ['HOTROAD'],
    JILI: ['JILI'],
    KINGMAKER: ['KINGMAKER', 'KM'],
    NETENT: ['NETENT'],
    PG: ['PG', 'PGSOFT'],
    PP: ['PP', 'PRAGMATICPLAY', 'PRAGMATIC'],
    PT: ['PT', 'PLAYTECH'],
    SEXYBCRT: ['SEXYBCRT', 'SEXY', 'MX'],
    SPADE: ['SPADE', 'SPADEGAMING', 'SG'],
    SPRIBE: ['SPRIBE'],
    YESBINGO: ['YESBINGO'],
    FC: ['FC', 'FACAICAI'],
}

export function normalizedReferenceKey(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function referenceCategoryKey(category) {
    return normalizedReferenceKey(category) === 'SLOTS'
        ? 'slot'
        : String(category || '').toLowerCase()
}

function providerKeys(value) {
    const key = normalizedReferenceKey(value)
    const aliases = providerAliases[key] || [key]
    return new Set(aliases.map(normalizedReferenceKey))
}

const referenceImagesByUid = new Map()
const referenceImagesByName = new Map()

Object.entries(referenceCatalogue).forEach(([category, section]) => {
    ;(section?.providers || []).forEach((provider) => {
        ;(provider.games || []).forEach((game) => {
            if (!game?.img) return
            const entry = {
                category,
                img: game.img,
                provider: provider.name || game.provider || '',
            }
            const uid = normalizedReferenceKey(game.uid)
            if (uid && !referenceImagesByUid.has(uid)) referenceImagesByUid.set(uid, entry)

            const name = normalizedReferenceKey(game.name)
            if (!name) return
            if (!referenceImagesByName.has(name)) referenceImagesByName.set(name, [])
            referenceImagesByName.get(name).push(entry)
        })
    })
})

function apiProviderValues(game) {
    return [
        game.provider,
        game.raw?.provider,
        game.raw?.provider_name,
        game.raw?.provider_code,
        game.raw?.brand,
    ].filter(Boolean)
}

function providerMatches(game, referenceProvider) {
    const expected = providerKeys(referenceProvider)
    return apiProviderValues(game).some((value) => {
        const actual = providerKeys(value)
        return [...actual].some((key) => expected.has(key))
    })
}

export function withLightReferenceImage(game) {
    const featuredImage = featuredGameArtwork(game.name)
    if (featuredImage) return { ...game, img: featuredImage }

    const uidCandidates = [
        game.uid,
        game.raw?.reference_code,
        game.raw?.game_code,
        game.raw?.game_id,
    ]
    for (const value of uidCandidates) {
        const match = referenceImagesByUid.get(normalizedReferenceKey(value))
        if (match?.img) return { ...game, img: match.img, fallbackImg: game.img }
    }

    const candidates = referenceImagesByName.get(normalizedReferenceKey(game.name)) || []
    if (!candidates.length) return game

    const providerMatch = candidates.find((candidate) => providerMatches(game, candidate.provider))
    const referenceImage = providerMatch?.img || candidates[0].img
    return referenceImage ? { ...game, img: referenceImage, fallbackImg: game.img } : game
}

export function availableReferenceProviders(category, apiGames = []) {
    const key = referenceCategoryKey(category)
    if (!apiGames.length) return []

    // The API already returns every active game in the PDF provider order.
    // Group the stream without re-sorting so unlisted providers remain after
    // the PDF sequence and newly-added catalogue games are never discarded.
    const providers = new Map()
    apiGames.forEach((game, index) => {
        const providerName = game.provider || game.raw?.provider_name || '9W'
        const providerKey = normalizedReferenceKey(providerName) || '9W'
        if (!providers.has(providerKey)) {
            providers.set(providerKey, { name: providerName, games: [] })
        }
        const displayGame = withLightReferenceImage(game)
        providers.get(providerKey).games.push({
            ...displayGame,
            referenceId: displayGame.referenceId || `${key}-${providerKey}-${displayGame.uid || index}`,
        })
    })
    return [...providers.values()]
}

export function referenceProviderMatches(left, right) {
    const leftKeys = providerKeys(left)
    return [...providerKeys(right)].some((key) => leftKeys.has(key))
}
