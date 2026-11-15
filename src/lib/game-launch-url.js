const COPIED_SITE_HOSTS = new Set([
    'velki247.vip',
    'www.velki247.vip',
    'velki247.live',
    'www.velki247.live',
    'velki.live',
    'www.velki.live',
])

const LOGIN_PATHS = new Set(['/login', '/auth/login'])
const SESSION_ERROR = 'The provider could not create a game session. Please try again.'

function normalizedPath(value) {
    const path = String(value || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')
    return path || '/'
}

function isLoginPath(value) {
    return LOGIN_PATHS.has(normalizedPath(value).toLowerCase())
}

export function validatedGameLaunchUrl(value) {
    const rawUrl = String(value || '').trim()
    if (!rawUrl) throw new Error('The game provider did not return a launch URL.')

    let url
    try {
        url = new URL(rawUrl, window.location.origin)
    } catch {
        throw new Error(SESSION_ERROR)
    }

    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(SESSION_ERROR)

    const currentHost = window.location.hostname.toLowerCase()
    const targetHost = url.hostname.toLowerCase()
    const copiedSiteRedirect = COPIED_SITE_HOSTS.has(targetHost) && targetHost !== currentHost
    const hashPath = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash

    if (copiedSiteRedirect || isLoginPath(url.pathname) || isLoginPath(hashPath)) {
        throw new Error(SESSION_ERROR)
    }

    return url.href
}

// Game sessions open on a few provider hosts. Remember them so later visits
// can open the connection (DNS + TLS) before the player taps a game.
const GAME_ORIGINS_KEY = 'velki_game_origins_v1'
const MAX_GAME_ORIGINS = 5
const preconnected = new Set()

function savedGameOrigins() {
    try {
        const origins = JSON.parse(localStorage.getItem(GAME_ORIGINS_KEY) || '[]')
        return Array.isArray(origins) ? origins.filter((origin) => typeof origin === 'string') : []
    } catch {
        return []
    }
}

export function preconnectGameOrigins(origins = savedGameOrigins()) {
    origins.forEach((origin) => {
        if (preconnected.has(origin)) return
        preconnected.add(origin)
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        document.head.appendChild(link)
    })
}

export function rememberGameOrigin(url) {
    try {
        const { origin } = new URL(url)
        const origins = [origin, ...savedGameOrigins().filter((item) => item !== origin)].slice(0, MAX_GAME_ORIGINS)
        localStorage.setItem(GAME_ORIGINS_KEY, JSON.stringify(origins))
    } catch {
        // Storage blocked: preconnect is only an optimisation.
    }
}
