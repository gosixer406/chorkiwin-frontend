import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { api } from '@/lib/api'

// Optional player features the site's admin can switch off. Until the server
// answers, the last known answer (or "everything on") is used so menus do not
// flicker for the usual case.
const STORAGE_KEY = 'velki_site_features_v1'
const ALL_ON = { p2p: true, loss_back: { daily: true, weekly: true, monthly: true }, spin: true }

function readStored() {
    try {
        const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
        return value && typeof value === 'object' ? { ...ALL_ON, ...value } : ALL_ON
    } catch {
        return ALL_ON
    }
}

let current = readStored()
let request = null
let requestKey = null
const listeners = new Set()

function load(key) {
    if (request && requestKey === key) return request
    requestKey = key
    request = api
        .get('/api/site-features', { cache: 'no-store' })
        .then((res) => {
            const data = res?.data || {}
            current = {
                p2p: data.p2p !== false,
                loss_back: { ...ALL_ON.loss_back, ...(data.loss_back || {}) },
                spin: data.spin !== false,
            }
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current))
            } catch {
                // storage blocked: the in-memory value still applies
            }
            listeners.forEach((fn) => fn(current))
            return current
        })
        .catch(() => current)
    return request
}

/** { p2p, loss_back: { daily, weekly, monthly }, spin } for this site and player. */
export default function useSiteFeatures() {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const [features, setFeatures] = useState(current)

    useEffect(() => {
        listeners.add(setFeatures)
        // Signing in or out can change P2P (an upline may block it).
        load(isLoggedIn ? 'user' : 'guest')
        return () => listeners.delete(setFeatures)
    }, [isLoggedIn])

    return features
}

/** True when at least one Loss Back period is on. */
export const anyLossBack = (features) => Object.values(features.loss_back || {}).some(Boolean)
