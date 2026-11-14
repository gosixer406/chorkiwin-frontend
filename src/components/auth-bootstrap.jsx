import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api, readSession } from '@/lib/api'
import { finishAuth, logout, setUser, setWallet } from '@/lib/auth'
import { StartupFallback } from '@/components/preloader'
import ExchangeSyncNotice from '@/components/exchange-sync-notice'
import {
    ACCOUNT_REFRESH_EVENT,
    EXCHANGE_EXIT_CHANNEL,
    collectActiveExchange,
    endExchangeOnReturn,
    exchangeExitObserved,
    isCurrentExchangeTransfer,
    fetchFreshAccount,
    finishExchangeGameTab,
    markExchangeExitObserved,
    readExchangeWalletSnapshot,
} from '@/lib/refresh-account'
import { AWAY_LIMIT_MS, isAwayTooLong, markSeen, returnFromGame } from '@/lib/away-logout'
import { BALANCE_POLL_MS, shouldSyncOnReturn, startPolling } from '@/lib/polling'

const EXCHANGE_EXIT_TOKEN = 'JITBO_EXCHANGE_EXIT'
const STARTUP_MAX_WAIT_MS = 1000
const SEEN_STAMP_MS = 5_000

// Same as the header's sign-out: revoke the token server-side, clear it locally regardless.
function signOut(dispatch) {
    api.post('/api/auth/logout', {}).catch(() => { /* cleared locally regardless */ })
    dispatch(logout())
}

export default function AuthBootstrap({ children }) {
    const dispatch = useDispatch()
    const initialized = useSelector((state) => state.auth.initialized)
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const accountRole = useSelector((state) => state.auth.user?.role)
    const [startupReady, setStartupReady] = useState(false)

    // This site is for players only: a staff session already open here is ended.
    useEffect(() => {
        if (isLoggedIn && accountRole && String(accountRole).toLowerCase() !== 'user') signOut(dispatch)
    }, [accountRole, dispatch, isLoggedIn])

    // Auto sign-out once the site has been off screen (hidden, minimised or closed) for 5 minutes.
    useEffect(() => {
        if (!isLoggedIn) return undefined
        const check = () => {
            if (document.visibilityState === 'visible') {
                if (isAwayTooLong()) return signOut(dispatch)
                returnFromGame()
                markSeen()
            } else if (isAwayTooLong()) {
                signOut(dispatch)
            }
        }
        const stampOnLeave = () => markSeen()
        check()
        // Hidden tabs keep checking too, so the sign-out happens while the player is away,
        // not only when they come back (browsers may slow this timer down in the background).
        const interval = window.setInterval(check, SEEN_STAMP_MS)
        const timeout = () => window.setTimeout(check, AWAY_LIMIT_MS + 1_000)
        let awayTimer = 0
        const onVisibility = () => {
            window.clearTimeout(awayTimer)
            if (document.visibilityState === 'hidden') {
                // Count the 5 minutes from the moment the player left, not from the last 5s stamp.
                markSeen()
                awayTimer = timeout()
            }
            check()
        }
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('pageshow', check)
        window.addEventListener('pagehide', stampOnLeave)
        return () => {
            window.clearInterval(interval)
            window.clearTimeout(awayTimer)
            document.removeEventListener('visibilitychange', onVisibility)
            window.removeEventListener('pageshow', check)
            window.removeEventListener('pagehide', stampOnLeave)
        }
    }, [dispatch, isLoggedIn])

    useEffect(() => {
        if (!startupReady || !initialized || !readSession().accessToken) return undefined
        let active = true
        let lastWalletSignature = ''

        const refreshLiveWallet = async () => {
            const response = await api.get('/api/wallet/balance?live_exposure=1', {
                cache: 'no-store',
            })
            const nextWallet = response.data || {}
            const signature = JSON.stringify(nextWallet)
            if (active && signature !== lastWalletSignature) {
                lastWalletSignature = signature
                dispatch(setWallet(nextWallet))
            }
        }
        const poller = startPolling(refreshLiveWallet, BALANCE_POLL_MS)
        poller.tick()
        return () => {
            active = false
            poller.stop()
        }
    }, [dispatch, initialized, startupReady])

    useEffect(() => {
        let active = true
        const session = readSession()
        let accountSync = null
        let accountSyncCollectsExchange = false
        let collectionRetryTimer = 0

        const syncAccount = (collectExchange = false) => {
            if (accountSync) {
                if (collectExchange && !accountSyncCollectsExchange) {
                    return accountSync.catch(() => null).then(() => syncAccount(true))
                }
                return accountSync
            }
            accountSyncCollectsExchange = collectExchange
            accountSync = (async () => {
                let preserveWallet = null
                if (collectExchange) {
                    const exchange = await collectActiveExchange({ force: true })
                    if (!exchange.settled) preserveWallet = readExchangeWalletSnapshot()
                }
                const account = await fetchFreshAccount({ preserveWallet })
                if (active) dispatch(setUser(account))
                return account
            })().finally(() => {
                accountSync = null
                accountSyncCollectsExchange = false
            })
            return accountSync
        }

        const waitForBackend = async () => {
            // Keep the initial loader visible until the backend has a complete
            // catalogue. A cold provider refresh can legitimately take longer
            // than 20 seconds, so never release the app with partial data.
            // Errors (backend down or mid-deploy) are retried below, so no
            // separate health round trip is needed first.
            while (active) {
                try {
                    const response = await api.get('/api/bootstrap', {
                        auth: false,
                        retry: false,
                        cache: 'no-store',
                    })
                    if (response.data?.ready) return response.data
                } catch {
                    // A rolling deployment may expose this endpoint a moment
                    // after health becomes available.
                }
                await new Promise((resolve) => window.setTimeout(resolve, 500))
            }
            return null
        }

        const waitForBrowserCatalogues = async () => {
            // Loaded on demand so the large reference catalogue stays out of
            // the entry bundle and the loader paints sooner.
            const { HOT_CATALOGUE_PATH, landingCataloguePath, preloadNewHomeCatalogues } = await import('@/lib/new-catalogue')
            const { warmImages } = await import('@/lib/image-url')
            // The Hot list and the provider list are small and shown first:
            // fetch them now and start their first images; other tabs wait for idle.
            preloadNewHomeCatalogues({ paths: [HOT_CATALOGUE_PATH] }).then(([result]) => {
                if (result?.status === 'fulfilled') warmImages(result.value?.games || [])
            })
            api.get('/api/9w/hall/providers').catch(() => null)
            // Warm the other home tabs only once the browser is idle: on a phone
            // seven catalogue downloads at startup starve the screen being shown.
            const warmLater = () => preloadNewHomeCatalogues()
            if ('requestIdleCallback' in window) window.requestIdleCallback(warmLater, { timeout: 4000 })
            else window.setTimeout(warmLater, 2500)
            const landingPath = landingCataloguePath(window.location)
            if (!landingPath) return true
            while (active) {
                try {
                    await preloadNewHomeCatalogues({ strict: true, paths: [landingPath] })
                    return true
                } catch {
                    // Retry the small first-page request while the existing
                    // first-load screen remains visible.
                }
                await new Promise((resolve) => window.setTimeout(resolve, 750))
            }
            return false
        }

        const bootstrap = async () => {
            // The home page asks for its banners and notices right after the
            // loader closes; start that request now so it is already cached.
            if (/^\/(popular|sports|casino|slots|table|crash|fishing|arcade|lottery)?$/.test(window.location.pathname)) {
                api.get('/api/home-sections').catch(() => null)
            }
            const hasActiveExchange = localStorage.getItem('velki_exchange_active') === '1'
            // Local exposure only: the live provider figure arrives from the
            // wallet refresh that runs right after the app opens.
            const loadAccount = () => fetchFreshAccount({
                liveExposure: false,
                preserveWallet: hasActiveExchange && exchangeExitObserved() ? readExchangeWalletSnapshot() : null,
            })
            // Start every startup request at once instead of one after another.
            // An early account failure (e.g. backend still starting) is retried
            // once the backend reports ready.
            const earlyAccount = session.accessToken ? loadAccount().catch(() => null) : null
            const backendReady = Promise.all([waitForBackend(), waitForBrowserCatalogues()])
            // Hold the loader for at most ~1s. The pages show their own loading
            // states and pick up the catalogues once the backend finishes warming.
            await Promise.race([
                backendReady,
                new Promise((resolve) => window.setTimeout(resolve, STARTUP_MAX_WAIT_MS)),
            ])
            if (!active) return

            if (!session.accessToken) {
                dispatch(finishAuth())
                setStartupReady(true)
                return
            }
            if (session.user) {
                // Open on the account saved at the last visit and refresh it
                // behind the page; an expired session still logs out via the
                // 401 handler.
                dispatch(setUser(session.user))
                setStartupReady(true)
                const account = (await earlyAccount) || await backendReady.then(loadAccount).catch(() => null)
                if (account && active) dispatch(setUser(account))
                if (active && exchangeExitObserved()) syncAccountOnReturn(true)
                return
            }
            try {
                // Render the returning VELKI session immediately. Exchange
                // collection can involve a slow provider call and must not
                // hold the whole app on a loader or make it appear logged out.
                const account = (await earlyAccount) || await loadAccount()
                if (active) dispatch(setUser(account))
            } catch {
                if (active) dispatch(logout())
            } finally {
                if (active) setStartupReady(true)
            }
            if (active && exchangeExitObserved()) syncAccountOnReturn(true)
        }

        const handleUnauthorized = () => dispatch(logout())
        let lastReturnSync = 0
        // When this tab was last hidden (e.g. the player went to the 9 Wickets tab).
        let leftSiteAt = document.visibilityState === 'visible' ? 0 : Date.now()
        const scheduleCollectionRetry = () => {
            if (!active || collectionRetryTimer || !exchangeExitObserved()) return
            collectionRetryTimer = window.setTimeout(() => {
                collectionRetryTimer = 0
                syncAccountOnReturn(true)
            }, 2500)
        }
        // Explicit: a game exit, a money action, or the exchange bridge.
        const syncAccountOnReturn = (collectExchange = false) => {
            if (!readSession().accessToken) return Promise.resolve(null)
            lastReturnSync = Date.now()
            const shouldCollect = collectExchange || exchangeExitObserved()
            return syncAccount(shouldCollect).then((account) => {
                if (shouldCollect) scheduleCollectionRetry()
                return account
            }).catch(() => {
                // A later focus, game exit, or manual refresh can retry safely.
                lastReturnSync = 0
                if (shouldCollect) scheduleCollectionRetry()
                return null
            })
        }
        // Implicit: the tab came back. Session expiry is still caught by the
        // wallet poll that runs on the same return.
        const syncWhenVisible = () => {
            if (document.visibilityState !== 'visible') {
                leftSiteAt = Date.now()
                return
            }
            const exchangeActive = localStorage.getItem('velki_exchange_active') === '1'
            // Coming back to the site from the 9 Wickets tab ends that session:
            // its tab is closed and the balance is brought back and refreshed.
            // (A moment's grace so the launch itself, which hides this tab, never counts.)
            if (exchangeActive && leftSiteAt && Date.now() - leftSiteAt > 1500 && endExchangeOnReturn()) {
                leftSiteAt = 0
                syncAccountOnReturn(true)
                return
            }
            if (exchangeActive) {
                if (exchangeExitObserved() && Date.now() - lastReturnSync > 2000) syncAccountOnReturn(true)
                return
            }
            if (exchangeExitObserved() && Date.now() - lastReturnSync > 2000) {
                syncAccountOnReturn(true)
                return
            }
            if (shouldSyncOnReturn({ now: Date.now(), lastSyncAt: lastReturnSync, exchangeActive })) {
                syncAccountOnReturn()
            }
        }
        const syncFromExitBridge = (event) => {
            if (event.origin !== window.location.origin) return
            const messageType = typeof event.data === 'string' ? event.data : event.data?.type
            if (messageType === EXCHANGE_EXIT_TOKEN) {
                markExchangeExitObserved({ notify: false })
                syncAccountOnReturn(true)
            }
        }
        const exitChannel = typeof BroadcastChannel === 'function'
            ? new BroadcastChannel(EXCHANGE_EXIT_CHANNEL)
            : null
        if (exitChannel) {
            exitChannel.onmessage = (event) => {
                if (event.data?.type !== 'settled') return
                if (!isCurrentExchangeTransfer(event.data.transfer_id)) return
                finishExchangeGameTab()
                if (event.data.wallet) dispatch(setWallet(event.data.wallet))
                syncAccountOnReturn()
            }
        }
        const onAccountRefresh = (event) => syncAccountOnReturn(event.detail?.collectExchange === true)
        window.addEventListener('velki:unauthorized', handleUnauthorized)
        window.addEventListener(ACCOUNT_REFRESH_EVENT, onAccountRefresh)
        window.addEventListener('pageshow', syncWhenVisible)
        window.addEventListener('focus', syncWhenVisible)
        window.addEventListener('message', syncFromExitBridge)
        document.addEventListener('visibilitychange', syncWhenVisible)
        bootstrap()
        return () => {
            active = false
            window.clearTimeout(collectionRetryTimer)
            exitChannel?.close()
            window.removeEventListener('velki:unauthorized', handleUnauthorized)
            window.removeEventListener(ACCOUNT_REFRESH_EVENT, onAccountRefresh)
            window.removeEventListener('pageshow', syncWhenVisible)
            window.removeEventListener('focus', syncWhenVisible)
            window.removeEventListener('message', syncFromExitBridge)
            document.removeEventListener('visibilitychange', syncWhenVisible)
        }
    }, [dispatch])

    if (!startupReady || !initialized) {
        return <StartupFallback />
    }
    return (
        <>
            {children}
            <ExchangeSyncNotice />
        </>
    )
}
