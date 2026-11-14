import { useEffect, useState } from 'react'
import { EXCHANGE_SYNC_EVENT, exchangeSyncInProgress } from '@/lib/refresh-account'

// Most collects finish in well under a second; only show the notice when the
// player would otherwise be left waiting without feedback.
const SHOW_AFTER_MS = 400

/** "Returning balance…" while a 9 Wickets balance is being collected. */
export default function ExchangeSyncNotice() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        let timer = 0
        const update = (active) => {
            window.clearTimeout(timer)
            if (active) timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
            else setVisible(false)
        }
        const onSync = (event) => update(event.detail?.active === true)
        update(exchangeSyncInProgress())
        window.addEventListener(EXCHANGE_SYNC_EVENT, onSync)
        return () => {
            window.clearTimeout(timer)
            window.removeEventListener(EXCHANGE_SYNC_EVENT, onSync)
        }
    }, [])

    if (!visible) return null
    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-3 z-[1000] mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2 rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg"
        >
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            Returning balance…
        </div>
    )
}
