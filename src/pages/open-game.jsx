import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { normalizeGame } from '@/lib/games'
import { rememberGameOrigin, validatedGameLaunchUrl } from '@/lib/game-launch-url'
import { OPEN_GAME_PREFIX } from '@/lib/casino-game-tab'
import logo from '@/assets/img/logo/short_logo_3d.png'

// /open-game/<platform>/<game uid>?name=<game name>
// The casino game tab (gamex24's OpenGameLauncher): a top bar with the logo and
// a close button over a dark stage while the launch request runs, then this
// tab moves on to the provider. Rendered outside the app shell (App.jsx), so
// it does not take over the site tab or run the site's startup.
function readRequest() {
    const parts = window.location.pathname.slice(OPEN_GAME_PREFIX.length).split('/')
    const name = new URLSearchParams(window.location.search).get('name') || 'Game'
    let uid
    try {
        uid = decodeURIComponent(parts[1] || '')
    } catch {
        uid = ''
    }
    return { platform: Number(parts[0]) === 2 ? 2 : 1, uid, name }
}

// Reference catalogue tiles carry a placeholder id: find the live game by name.
async function resolveUid({ uid, name }) {
    if (!uid.startsWith('reference:')) return uid
    const response = await api.get(`/api/9w/hall/games?search=${encodeURIComponent(name)}&limit=20`)
    const matches = (response.data || []).map(normalizeGame)
    const game = matches.find((candidate) => candidate.name.trim().toLowerCase() === name.trim().toLowerCase()) || matches[0]
    if (!game) throw new Error('This provider game is temporarily unavailable.')
    return game.uid
}

export default function OpenGame() {
    const [request] = useState(readRequest)
    const [error, setError] = useState('')
    const started = useRef(false)

    const close = useCallback(() => {
        window.close()
        window.setTimeout(() => {
            if (!window.closed) window.location.replace('/')
        }, 180)
    }, [])

    const launch = useCallback(async () => {
        setError('')
        try {
            if (!request.uid) throw new Error('This game link is not valid.')
            const gameUid = await resolveUid(request)
            const response = await api.post('/api/9w/launch', {
                game_uid: gameUid,
                wallet_mode: 'both',
                language: 'en',
                platform: request.platform,
            })
            const gameUrl = validatedGameLaunchUrl(response.data?.game_url)
            rememberGameOrigin(gameUrl)
            // The site tab watches this one and refreshes the wallet when it closes.
            window.location.replace(gameUrl)
        } catch (launchError) {
            setError(launchError.message || 'Game launch failed. Please try again.')
        }
    }, [request])

    useEffect(() => {
        document.title = `${request.name} - Chorki88`
        window.__closeSplash?.()
        if (started.current) return
        started.current = true
        launch()
    }, [launch, request.name])

    return (
        <main className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-black text-white">
            <header className="flex h-[calc(50px+env(safe-area-inset-top))] shrink-0 items-center justify-between bg-[#161616] pt-[env(safe-area-inset-top)] md:h-[calc(56px+env(safe-area-inset-top))]">
                <img src={logo} alt="Chorki88" className="ml-2.5 h-8 w-32 object-contain object-left md:h-9 md:w-36" />
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close game"
                    className="mr-3 grid size-9 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-4.5" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </header>
            <section className="grid min-h-0 flex-1 place-items-center bg-black p-6" aria-live="polite">
                {/* While the launch request runs: "Launching <game>..." (gamex24's launch message). */}
                {!error && (
                    <div role="status" className="grid w-[min(280px,80vw)] justify-items-center text-center">
                        <p className="m-0 max-w-full truncate font-poppins text-[15px] font-medium text-white/85">
                            Launching {request.name}...
                        </p>
                    </div>
                )}
                {error && (
                    <div className="grid w-[min(260px,72vw)] justify-items-center gap-2.5 text-center">
                        <img src={logo} alt="" className="h-auto w-[min(190px,58vw)] object-contain" />
                        <p className="m-0 text-sm leading-snug text-[#ff727c]">{error}</p>
                        <button
                            type="button"
                            onClick={launch}
                            className="h-9 min-w-34 cursor-pointer rounded-[5px] border-0 bg-[#f4b600] font-semibold text-[#0e2749]"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </section>
        </main>
    )
}
