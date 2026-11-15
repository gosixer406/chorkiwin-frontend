// Card-sized game artwork from Cloudinary.
//
// * Backend game images are already Cloudinary URLs; their transformation is
//   swapped for one sized to the card.
// * Bundled artwork (/reference-games-v2, /game-icons) is mirrored on Cloudinary
//   under game-catalog/web/<same path>. The local file stays as the fallback.
// f_auto picks WebP/AVIF per browser, q_auto tunes quality, c_limit never upscales.
const CLOUD = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim()
const WEB_FOLDER = 'game-catalog/web'
const MIRRORED_PREFIXES = ['/reference-games-v2/', '/game-icons/']

const transform = (width) => `f_auto,q_auto,c_limit,w_${width}`

export function sizedImage(url, width) {
    if (!url) return ''
    if (url.includes('res.cloudinary.com/') && url.includes('/image/upload/')) {
        // Replace the backend's transformation segment (e.g. f_auto,q_auto,w_300) or insert one.
        return url.replace(/\/image\/upload\/(?:[a-z]{1,3}_[^/]*\/)?/, `/image/upload/${transform(width)}/`)
    }
    if (CLOUD && MIRRORED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
        const publicId = url.slice(1).replace(/\.[a-z0-9]+$/i, '')
        return `https://res.cloudinary.com/${CLOUD}/image/upload/${transform(width)}/${WEB_FOLDER}/${encodeURI(publicId)}`
    }
    return url
}

/** `srcSet` for 1x / 2x screens, or undefined when the URL cannot be resized. */
export function sizedSrcSet(url, width) {
    const one = sizedImage(url, width)
    if (!one || one === url) return undefined
    return `${one} 1x, ${sizedImage(url, width * 2)} 2x`
}

/**
 * Ordered image candidates for a game card: sized Cloudinary copies first,
 * then the original URLs, then the placeholder.
 */
export function imageCandidates(width, ...urls) {
    const out = []
    const seen = new Set()
    const push = (src, srcSet) => {
        if (!src || seen.has(src)) return
        seen.add(src)
        out.push({ src, srcSet })
    }
    const originals = urls.filter(Boolean)
    originals.forEach((url) => push(sizedImage(url, width), sizedSrcSet(url, width)))
    originals.forEach((url) => push(url))
    return out
}

const warmed = new Set()

/** Start downloading the first images of a list (e.g. the Hot games) before they render. */
export function warmImages(games, { count = 9, width = 180 } = {}) {
    const ratio = Math.min(2, Math.ceil(window.devicePixelRatio || 1))
    games.slice(0, count).forEach((game) => {
        const src = sizedImage(game?.img, width * ratio)
        if (!src || warmed.has(src)) return
        warmed.add(src)
        const image = new Image()
        image.decoding = 'async'
        image.fetchPriority = 'high'
        image.src = src
    })
}
