import { useEffect, useState } from 'react'
import { MonitorX } from 'lucide-react'

// The site runs in one browser tab at a time. The newest tab takes over; any
// older one is covered until the player picks "Use here" (which takes it back).
// Tabs talk over a BroadcastChannel, with a localStorage event as the fallback.
const CHANNEL = 'velki_single_tab'
const STORAGE_KEY = 'velki_active_tab'
const tabId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function announce(channel) {
    const claim = { type: 'claim', id: tabId, at: Date.now() }
    channel?.postMessage(claim)
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(claim))
    } catch {
        // storage blocked: the channel alone still works
    }
}

export default function SingleTabGuard({ children }) {
    const [inactive, setInactive] = useState(false)

    useEffect(() => {
        const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL) : null
        const onClaim = (claim) => {
            if (claim?.type === 'claim' && claim.id && claim.id !== tabId) setInactive(true)
        }
        const onMessage = (event) => onClaim(event.data)
        const onStorage = (event) => {
            if (event.key !== STORAGE_KEY || !event.newValue) return
            try {
                onClaim(JSON.parse(event.newValue))
            } catch {
                // ignore a malformed value
            }
        }
        channel?.addEventListener('message', onMessage)
        window.addEventListener('storage', onStorage)
        announce(channel)
        return () => {
            channel?.removeEventListener('message', onMessage)
            channel?.close()
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    useEffect(() => {
        if (inactive) window.__closeSplash?.()
    }, [inactive])

    // Reloading makes this tab the newest one: it claims the site again and
    // starts from fresh data instead of what it showed while covered.
    const useHere = () => window.location.reload()

    return <>
        {children}
        {inactive && (
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="single-tab-title"
                className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm"
            >
                <div className="w-full max-w-[340px] rounded-xl border border-gold/40 bg-surface p-6 text-center shadow-2xl">
                    <MonitorX className="mx-auto size-10 text-gold" strokeWidth={1.5} />
                    <h2 id="single-tab-title" className="mt-3 font-poppins text-base font-semibold text-ink">
                        Open in another tab
                    </h2>
                    <p className="mt-2 font-poppins text-xs leading-relaxed text-ink-muted">
                        This site is already open in another tab or window. You can use it in one tab at a time.
                    </p>
                    <button
                        type="button"
                        onClick={useHere}
                        className="mt-5 w-full rounded-md bg-linear-to-b from-gold-light to-gold-dark py-2.5 font-poppins text-sm font-semibold text-on-gold"
                    >
                        Use here
                    </button>
                </div>
            </div>
        )}
    </>
}
