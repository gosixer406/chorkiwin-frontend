import { useSyncExternalStore } from 'react'
import { api } from '@/lib/api'

// The site's display currency, set per site in the Mother Panel (Sites &
// Domains) and served by /api/site-config. Default USD. The last known value
// is cached so the first paint already shows the right code.
const CACHE_KEY = 'site_currency'

const readCache = () => {
    try {
        return localStorage.getItem(CACHE_KEY) || ''
    } catch {
        return ''
    }
}

// Live binding: modules that import DISPLAY_CURRENCY see the loaded value.
export let DISPLAY_CURRENCY = readCache() || 'USD'

const listeners = new Set()

const setCurrency = (code) => {
    const next = String(code || 'USD').trim().toUpperCase() || 'USD'
    if (next === DISPLAY_CURRENCY) return
    DISPLAY_CURRENCY = next
    try {
        localStorage.setItem(CACHE_KEY, next)
    } catch {
        /* storage unavailable */
    }
    listeners.forEach((fn) => fn())
}

/** (Re)load this site's currency from the server. */
export const loadSiteCurrency = () =>
    api
        .get('/api/site-config', { auth: false })
        .then((response) => setCurrency(response?.data?.currency))
        .catch(() => {
            /* keep the cached / default currency */
        })

const subscribe = (fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
}

/** The site's currency code; re-renders when it loads or changes. */
export const useDisplayCurrency = () => useSyncExternalStore(subscribe, () => DISPLAY_CURRENCY)

export const formatMoney = (value) => (
    `${DISPLAY_CURRENCY} ${Number(value || 0).toFixed(2)}`
)

if (typeof window !== 'undefined') loadSiteCurrency()
