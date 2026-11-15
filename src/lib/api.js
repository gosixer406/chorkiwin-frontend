import { clearSeen, returnFromGame } from './away-logout'
import { responseCacheTtl } from './cache-policy'
const API_ORIGIN =(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
// In dev, API calls go through the Vite /api proxy so they stay same-origin.
// The backend's CORS only allows localhost, so a phone opening the dev server
// via the LAN IP would otherwise have every request blocked.
const API_BASE = import.meta.env.DEV ? '' : API_ORIGIN
const SESSION_KEY = 'velki_session'
// One backend serves many sites; it picks the site (tenant) from this host.
// Each site has its own frontend build. Set VITE_TENANT_DOMAIN when the build
// runs on a host that is not registered for the site (dev, preview, CDN).
export const TENANT_HOST = (import.meta.env.VITE_TENANT_DOMAIN || window.location.host).toLowerCase()
// Caches that only speed up first paint and can be thrown away at any time.
const DISPOSABLE_STORAGE_KEYS = ['velki_home_catalogues_v1', 'velki_home_sections_v1']
let refreshRequest = null
const responseCache = new Map()
const inFlightGets = new Map()

function getCacheKey(path, auth) {
    const accessToken = auth ? (readSession().accessToken || '') : ''
    return `${accessToken || 'guest'}:${path}`
}

export function readSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') || {}
    } catch {
        return {}
    }
}

export function writeSession(session) {
    if (!session?.accessToken && !session?.refreshToken) {
        localStorage.removeItem(SESSION_KEY)
        return
    }
    const value = JSON.stringify(session)
    try {
        localStorage.setItem(SESSION_KEY, value)
    } catch {
        // Storage is full: the session matters more than the page caches, so
        // drop those and try once more.
        DISPOSABLE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
        try {
            localStorage.setItem(SESSION_KEY, value)
        } catch {
            // Still blocked: the in-memory Redux state keeps this tab signed in.
        }
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
    // A stale away-timer stamp would sign the next login straight back out.
    clearSeen()
    returnFromGame({ force: true })
}

export const LOGOUT_REASON_KEY = 'velki_logout_reason'

async function parseResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
        ? await response.json()
        : { success: response.ok, message: await response.text() }

    if (!response.ok || payload.success === false) {
        const error = new Error(payload.message || `Request failed (${response.status})`)
        error.status = response.status
        error.payload = payload
        throw error
    }
    return payload
}

async function refreshAccessToken() {
    if (refreshRequest) return refreshRequest

    refreshRequest = (async () => {
        const session = readSession()
        if (!session.refreshToken) return null

        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.refreshToken}`, 'X-Tenant': TENANT_HOST },
        })
        const payload = await parseResponse(response)
        const accessToken = payload.data?.access_token
        if (!accessToken) return null
        // Another request may have updated the stored user while refresh was
        // in flight. Merge into the newest session instead of restoring a
        // stale snapshot.
        writeSession({ ...readSession(), accessToken })
        return accessToken
    })().finally(() => {
        refreshRequest = null
    })

    return refreshRequest
}

async function executeApiRequest(path, options = {}) {
    const { auth = true, retry = true, body, headers, ...requestOptions } = options
    const session = readSession()
    const requestHeaders = new Headers(headers || {})
    requestHeaders.set('Accept', 'application/json')
    requestHeaders.set('X-Tenant', TENANT_HOST)
    if (body !== undefined && !(body instanceof FormData)) {
        requestHeaders.set('Content-Type', 'application/json')
    }
    if (auth && session.accessToken) {
        requestHeaders.set('Authorization', `Bearer ${session.accessToken}`)
    }

    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...requestOptions,
            headers: requestHeaders,
            body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
        })
        return await parseResponse(response)
    } catch (error) {
        if (auth && retry && error.status === 401 && session.refreshToken) {
            try {
                const accessToken = await refreshAccessToken()
                if (accessToken) return executeApiRequest(path, { ...options, retry: false })
            } catch {
                // The refresh token is no longer valid.
            }
        }
        if (auth && error.status === 401) {
            // A newer login on another device ended this session; the login page shows why.
            if (/another device/i.test(error.message)) {
                try { sessionStorage.setItem(LOGOUT_REASON_KEY, error.message) } catch { /* storage blocked */ }
            }
            clearSession()
            window.dispatchEvent(new CustomEvent('velki:unauthorized'))
        }
        throw error
    }
}

export async function apiRequest(path, options = {}) {
    const method = String(options.method || 'GET').toUpperCase()
    const ttl = method === 'GET' && options.cache !== 'no-store'
        ? responseCacheTtl(path)
        : 0
    if (!ttl) return executeApiRequest(path, options)

    const cacheKey = getCacheKey(path, options.auth !== false)
    const cached = responseCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.payload
    if (cached) responseCache.delete(cacheKey)
    if (inFlightGets.has(cacheKey)) return inFlightGets.get(cacheKey)

    const request = executeApiRequest(path, options)
        .then((payload) => {
            // Never freeze a partial provider snapshot. Catalogue components
            // intentionally retry while meta.loading is true.
            if (!payload?.meta?.loading) {
                responseCache.set(cacheKey, { payload, expiresAt: Date.now() + ttl })
            }
            return payload
        })
        .finally(() => inFlightGets.delete(cacheKey))
    inFlightGets.set(cacheKey, request)
    return request
}

export const api = {
    get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
    post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export function apiAssetUrl(value) {
    if (!value) return ''
    if (/^(https?:|data:|blob:)/i.test(value)) return value
    return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}
