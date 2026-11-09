import Loader from '@/components/loader'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X } from 'lucide-react'
import velkiLogo from '@/assets/img/logo/short_logo_3d.png'
import { setUser } from '@/lib/auth'
import { fetchFreshAccount, requestAccountRefresh } from '@/lib/refresh-account'
import useMobileGameImmersion from '@/hooks/use-mobile-game-immersion'
import {
    clearActiveEmbeddedGame,
    CLOSE_GAME_EVENT,
    OPEN_GAME_EVENT,
} from '@/lib/game-session-events'

export default function GameSession() {
    const dispatch = useDispatch()
    const wallet = useSelector((state) => state.auth.user?.wallet)
    const [session, setSession] = useState(null)
    const historyPushed = useRef(false)
    const refreshRun = useRef(0)
    const walletRef = useRef(wallet)
    const {
        containerRef,
        immersive,
        enterImmersive,
        leaveImmersive,
        exitGestureProps,
    } = useMobileGameImmersion()

    useEffect(() => {
        walletRef.current = wallet
    }, [wallet])

    const refreshWalletAfterExit = useCallback(async () => {
        const run = ++refreshRun.current
        const fallbackWallet = walletRef.current
        const delays = [0, 500, 1000, 2000]
        for (const [index, delay] of delays.entries()) {
            await new Promise((resolve) => window.setTimeout(resolve, delay))
            if (run !== refreshRun.current) return
            try {
                dispatch(setUser(await fetchFreshAccount({
                    liveExposure: true,
                    preserveWallet: index < delays.length - 1 ? fallbackWallet : null,
                })))
                // Update the shared headers right away. The remaining timed
                // requests keep this component's wallet in sync while a
                // provider settlement is still being finalised.
                if (index === 0) requestAccountRefresh()
            } catch {
                // The next scheduled refresh or the header button can retry.
            }
        }
    }, [dispatch])

    const finishSession = useCallback((navigateBack = true, refresh = true) => {
        leaveImmersive()
        clearActiveEmbeddedGame()
        setSession(null)
        if (refresh) refreshWalletAfterExit()
        if (navigateBack && historyPushed.current && window.history.state?.velkiEmbeddedGame) {
            historyPushed.current = false
            window.history.back()
        } else {
            historyPushed.current = false
        }
    }, [leaveImmersive, refreshWalletAfterExit])

    useEffect(() => {
        const openGame = (event) => {
            const detail = event.detail || {}
            setSession({ token: detail.token, url: detail.url || '', title: detail.title || 'Game' })
            if (!historyPushed.current) {
                window.history.pushState(
                    { ...window.history.state, velkiEmbeddedGame: true },
                    document.title,
                )
                historyPushed.current = true
            }
        }
        const cancelGame = () => finishSession(true, false)
        const closeOnBack = () => {
            if (!historyPushed.current) return
            historyPushed.current = false
            leaveImmersive()
            setSession(null)
            refreshWalletAfterExit()
        }
        window.addEventListener(OPEN_GAME_EVENT, openGame)
        window.addEventListener(CLOSE_GAME_EVENT, cancelGame)
        window.addEventListener('popstate', closeOnBack)
        return () => {
            window.removeEventListener(OPEN_GAME_EVENT, openGame)
            window.removeEventListener(CLOSE_GAME_EVENT, cancelGame)
            window.removeEventListener('popstate', closeOnBack)
        }
    }, [finishSession, leaveImmersive, refreshWalletAfterExit])

    useEffect(() => {
        if (!session) return undefined
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') finishSession()
        }
        window.addEventListener('keydown', closeOnEscape)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', closeOnEscape)
        }
    }, [finishSession, session])

    if (!session) return null

    return (
        <section
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${session.title} game`}
            className={`fixed inset-0 z-[100000] mx-auto flex h-dvh w-full flex-col bg-black ${immersive ? 'max-w-none' : 'max-w-[480px]'}`}
        >
            {!immersive && (
                <header className="flex min-h-11 shrink-0 items-center justify-between bg-page px-3 text-white shadow-md">
                    <img
                        src={velkiLogo}
                        alt="chorkix.com"
                        className="h-7 w-auto max-w-28 object-contain object-left"
                    />
                    <button
                        type="button"
                        onClick={() => finishSession()}
                        aria-label={`Close ${session.title}`}
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"
                    >
                        <X className="size-6" />
                    </button>
                </header>
            )}
            {session.url ? (
                <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
                    <iframe
                        title="chorkix.com Game"
                        src={session.url}
                        className="absolute inset-0 size-full border-0 bg-black"
                        allow="autoplay; fullscreen; payment; clipboard-read; clipboard-write"
                        allowFullScreen
                    />
                    {!immersive && (
                        <button
                            type="button"
                            onClick={enterImmersive}
                            aria-label="Enter fullscreen game"
                            className="absolute inset-0 z-10 block bg-transparent md:hidden"
                        />
                    )}
                    {immersive && (
                        <button
                            type="button"
                            onClick={leaveImmersive}
                            aria-label="Exit fullscreen game"
                            className="absolute inset-x-0 top-0 z-20 flex h-7 touch-pan-y items-start justify-center bg-gradient-to-b from-black/25 to-transparent pt-1 md:hidden"
                            {...exitGestureProps}
                        >
                            <span className="h-1 w-10 rounded-full bg-white/60 shadow" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid min-h-0 flex-1 place-items-center bg-black text-white">
                    <Loader label="Opening game…" className="text-white" />
                </div>
            )}
        </section>
    )
}
