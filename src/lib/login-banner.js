import { useEffect, useState } from 'react'
import { api, apiAssetUrl } from '@/lib/api'

// Admin > CMS > Login Banner: one image for the login and signup pages, with
// an optional dark-mode image and an optional link. The last answer is kept in
// localStorage so the page paints the right banner at once, and the image is
// fetched as soon as the app starts so it is already in the browser cache when
// the login page opens. A fresh answer replaces the stored one in the background.
const STORAGE_KEY = 'velki_login_banner_v1'
const ENDPOINT = '/api/site/login-banner'

let current = readStored()
let request = null
const listeners = new Set()

function readStored() {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
        return value && typeof value === 'object' ? value : null
    } catch {
        return null
    }
}

function store(value) {
    current = value
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
        // Storage blocked or full: the in-memory copy still serves this visit.
    }
    listeners.forEach((listener) => listener(value))
}

function isDark() {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/** The image URL for the current theme, or '' when the site uses its default banner. */
export function loginBannerSrc(banner = current) {
    if (!banner?.show) return ''
    const path = isDark() ? banner.dark_image_url || banner.light_image_url : banner.light_image_url || banner.dark_image_url
    return apiAssetUrl(path || banner.image_url || '')
}

function warmImage(banner) {
    const src = loginBannerSrc(banner)
    if (!src || typeof Image === 'undefined') return
    const image = new Image()
    image.decoding = 'async'
    image.src = src
}

/** Fetch the banner once (shared by every caller) and warm its image. */
export function prefetchLoginBanner() {
    if (current) warmImage(current)
    if (request) return request
    request = api.get(ENDPOINT, { auth: false })
        .then((response) => {
            const data = response?.data || {}
            const next = {
                show: !!data.show,
                light_image_url: data.light_image_url || null,
                dark_image_url: data.dark_image_url || null,
                image_url: data.image_url || null,
                link_url: data.link_url || null,
            }
            if (loginBannerSrc(next) !== loginBannerSrc(current)) warmImage(next)
            store(next)
            return next
        })
        .catch(() => {
            // Keep the stored banner (or the default one) when the request fails.
            request = null
            return current
        })
    return request
}

/** `{ banner, ready }`: ready is false only on a first visit before the answer arrives. */
export function useLoginBanner() {
    const [banner, setBanner] = useState(current)
    const [ready, setReady] = useState(!!current)

    useEffect(() => {
        let active = true
        listeners.add(setBanner)
        prefetchLoginBanner().finally(() => {
            if (active) setReady(true)
        })
        return () => {
            active = false
            listeners.delete(setBanner)
        }
    }, [])

    return { banner, ready }
}
