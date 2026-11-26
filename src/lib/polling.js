// Header Main / Exp: refreshed every 5 s (live exposure of open bets).
export const BALANCE_POLL_MS = 5_000
export const CURRENT_BETS_POLL_MS = 10_000
export const RETURN_SYNC_GAP_MS = 60_000

/**
 * Runs `run` every `intervalMs` while the page is visible, and when the player
 * comes back to it. A slow request never overlaps the next one, and the several
 * events a tab fires on return collapse into one. Returns { tick, stop }: call
 * `tick` for the first load.
 */
export function startPolling(run, intervalMs, { win = window, doc = document } = {}) {
    let inFlight = false
    let stopped = false

    const tick = async () => {
        if (stopped || inFlight || doc.visibilityState !== 'visible') return
        inFlight = true
        try {
            await run()
        } catch {
            // The next tick retries; the page keeps what it last showed.
        } finally {
            inFlight = false
        }
    }

    const timer = win.setInterval(tick, intervalMs)
    win.addEventListener('focus', tick)
    win.addEventListener('pageshow', tick)
    doc.addEventListener('visibilitychange', tick)

    return {
        tick,
        stop() {
            stopped = true
            win.clearInterval(timer)
            win.removeEventListener('focus', tick)
            win.removeEventListener('pageshow', tick)
            doc.removeEventListener('visibilitychange', tick)
        },
    }
}

/**
 * Should coming back to the tab reload the account? /api/auth/me settles bonuses,
 * so it is limited to once per gap. A tab becoming visible is not proof that
 * its still-open 9 Wickets session ended; exit/close handles collection.
 */
export function shouldSyncOnReturn({ now, lastSyncAt, exchangeActive, gapMs = RETURN_SYNC_GAP_MS }) {
    return !exchangeActive && now - lastSyncAt >= gapMs
}
