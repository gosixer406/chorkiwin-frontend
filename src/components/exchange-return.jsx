import { useEffect } from 'react'
import { EXCHANGE_EXIT_CHANNEL, exchangeReturnPath, exchangeTabTransferId, isCurrentExchangeTransfer, markExchangeExitObserved } from '@/lib/refresh-account'

// How long to wait for window.close() before showing the site in this tab instead.
const CLOSE_FALLBACK_MS = 300

function returnPath() {
    const candidate = new URLSearchParams(window.location.search).get('return_path') || exchangeReturnPath()
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '/sports'
    const url = new URL(candidate, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
}

/**
 * /9w-return: 9 Wickets sends its tab here when the player leaves the game.
 * No "returning" screen: the exit is recorded, the site tab that opened the
 * game is told to collect the balance and refresh it, and this tab closes.
 * If the browser will not close it (some phones and in-app browsers), the
 * site opens here and collects the balance itself on startup, since the
 * exit is already recorded. The page loader stays up until then, never a
 * blank page.
 */
export default function ExchangeReturn() {
    useEffect(() => {
        const transferId = exchangeTabTransferId()
        if (isCurrentExchangeTransfer(transferId)) {
            markExchangeExitObserved({ notify: false })
            if (typeof BroadcastChannel === 'function') {
                const channel = new BroadcastChannel(EXCHANGE_EXIT_CHANNEL)
                channel.postMessage({ type: 'exited', transfer_id: transferId })
                channel.close()
            }
        }
        try { window.close() } catch { /* Some browsers keep the tab open. */ }
        const timer = window.setTimeout(() => {
            if (!window.closed) window.location.replace(returnPath())
        }, CLOSE_FALLBACK_MS)
        return () => window.clearTimeout(timer)
    }, [])

    return null
}
