// Recovers from a page that failed to load or crashed. The usual cause is a lazy
// chunk that can no longer be fetched: a tab left open across a deploy still asks
// for the old file names, or the network has not come back yet after the phone
// wakes. React.lazy keeps that failure forever, so only a real reload clears it.
const LAST_RELOAD_KEY = 'velki_error_reload_at'
const RELOAD_GAP_MS = 30_000

let reloading = false

// Returns true while a reload is on its way. False means one was already tried a
// moment ago (or cannot be tracked) and the page should show its error screen,
// so a page that crashes every time never ends up in a reload loop.
export function recoverByReload() {
    if (reloading) return true
    try {
        const lastReload = Number(sessionStorage.getItem(LAST_RELOAD_KEY)) || 0
        if (Date.now() - lastReload < RELOAD_GAP_MS) return false
        sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()))
    } catch {
        return false
    }
    reloading = true
    // Reloading while offline would swap the app for the browser's own error page.
    if (navigator.onLine === false) {
        window.addEventListener('online', () => window.location.reload(), { once: true })
    } else {
        window.location.reload()
    }
    return true
}
