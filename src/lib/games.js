import { apiAssetUrl } from '@/lib/api'

const FEATURED_GAME_ARTWORK = {
    magicacewild: '/game-icons/featured/magic-ace-wild-lock.png',
    magicacewildlock: '/game-icons/featured/magic-ace-wild-lock.png',
    superaceexclusive: '/game-icons/featured/super-ace-exclusive.png',
    aviatorextrabet: '/game-icons/featured/aviator-extra-bet.png',
    aviatiorextrabet: '/game-icons/featured/aviator-extra-bet.png',
    salonprivebaccarat: '/game-icons/featured/salon-prive-baccarat.jpg',
}

function normalizedGameName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

export function featuredGameArtwork(value) {
    const key = normalizedGameName(value)
    if (key.startsWith('salonprivebaccarat')) {
        return FEATURED_GAME_ARTWORK.salonprivebaccarat
    }
    return FEATURED_GAME_ARTWORK[key] || ''
}

export function normalizeGame(game) {
    const uid = String(game.game_uid || game.game_code || game.game_id || game.id || '')
    const provider = game.provider_name || game.provider || game.provider_code || game.brand || '9W'
    const name = game.game_name || game.locale_name || game.name || 'Casino game'
    const providerArtwork = apiAssetUrl(
        game.img_url || game.game_image_narrow || game.game_image ||
        game.thumbnail_url || game.image_url || game.image || game.logo || ''
    )
    const featuredArtwork = featuredGameArtwork(name)
    return {
        uid,
        referenceId: String(game.reference_id || ''),
        name,
        img: featuredArtwork || providerArtwork,
        fallbackImg: featuredArtwork ? providerArtwork : '',
        provider,
        category: game.game_type || game.category || game.game_category || '',
        referenceGroup: game.reference_group || '',
        raw: game,
    }
}
