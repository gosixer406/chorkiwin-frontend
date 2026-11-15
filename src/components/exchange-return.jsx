import { useEffect, useState } from 'react'
import { readSession, writeSession } from '@/lib/api'
import { collectActiveExchange, EXCHANGE_EXIT_CHANNEL, exchangeReturnPath, exchangeTabTransferId, fetchFreshAccount, isCurrentExchangeTransfer, markExchangeExitObserved } from '@/lib/refresh-account'

function returnPath() {
    const candidate = new URLSearchParams(window.location.search).get('return_path') || exchangeReturnPath()
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '/sports'
    const url = new URL(candidate, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
}

export default function ExchangeReturn() {
    const [message, setMessage] = useState('Returning your 9 Wickets balance…')

    useEffect(() => {
        window.__closeSplash?.()
        let stopped = false
        let retryTimer = 0
        let fallbackTimer = 0
        // 9Wicket guide: send the player home after the cashout answer, or
        // after 6 seconds at most. The server's reconcile worker finishes an
        // unanswered cashout on its own, so leaving early never loses money.
        const deadlineTimer = window.setTimeout(() => {
            if (stopped) return
            stopped = true
            window.clearTimeout(retryTimer)
            try { window.close() } catch { /* Some browsers keep the tab open. */ }
            fallbackTimer = window.setTimeout(() => {
                if (!window.closed) window.location.replace(returnPath())
            }, 800)
        }, 6000)
        const channel = typeof BroadcastChannel === 'function'
            ? new BroadcastChannel(EXCHANGE_EXIT_CHANNEL)
            : null
        const transferId = exchangeTabTransferId()
        if (isCurrentExchangeTransfer(transferId)) markExchangeExitObserved({ notify: false })

        const settleAndClose = async () => {
            try {
                const collected = await collectActiveExchange({ force: true, transferId, strictSession: true })
                if (stopped) return
                if (!collected.settled) throw collected.error || new Error('Collection is pending')
                window.clearTimeout(deadlineTimer)
                if (collected.stale) {
                    try { window.close() } catch { /* Some browsers keep the tab open. */ }
                    fallbackTimer = window.setTimeout(() => {
                        if (!window.closed) window.location.replace(returnPath())
                    }, 800)
                    return
                }
                const account = await fetchFreshAccount({ liveExposure: false })
                if (stopped) return
                writeSession({ ...readSession(), user: account })
                channel?.postMessage({ type: 'settled', transfer_id: transferId, wallet: account.wallet })
                setMessage('Balance updated. Returning to the site…')
                try { window.close() } catch { /* Some browsers keep the tab open. */ }
                fallbackTimer = window.setTimeout(() => {
                    if (!window.closed) window.location.replace(returnPath())
                }, 800)
            } catch {
                if (stopped) return
                setMessage('Syncing your 9 Wickets balance. Please wait…')
                retryTimer = window.setTimeout(settleAndClose, 2100)
            }
        }

        settleAndClose()
        return () => {
            stopped = true
            window.clearTimeout(retryTimer)
            window.clearTimeout(fallbackTimer)
            window.clearTimeout(deadlineTimer)
            channel?.close()
        }
    }, [])

    return <div role="status" className="fixed inset-0 flex items-center justify-center bg-[#111] px-6 text-center text-white">{message}</div>
}
