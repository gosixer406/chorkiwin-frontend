import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { api } from '@/lib/api'
import { preconnectGameOrigins, rememberGameOrigin, validatedGameLaunchUrl } from '@/lib/game-launch-url'
import { beginEmbeddedGame, cancelEmbeddedGame, openEmbeddedGame } from '@/lib/game-session-events'
import { isExchangeGameTabOpen, rememberExchangeReturnPath, rememberExchangeWallet, requestAccountRefresh, waitForExchangeRelaunch, watchExchangeGameTab } from '@/lib/refresh-account'
import { markGameAway, returnFromGame } from '@/lib/away-logout'

// Every game list uses this hook; warm the provider hosts once per page load.
preconnectGameOrigins()

function platformCode() {
    return window.matchMedia('(max-width: 768px)').matches ? 2 : 1
}

export default function useGameLauncher() {
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoggedIn, user } = useSelector((state) => state.auth)
    const [launchingId, setLaunchingId] = useState('')
    const [error, setError] = useState('')
    const launchInFlight = useRef(false)

    const requireLogin = () => {
        if (isLoggedIn) return true
        navigate('/login', { state: { returnTo: `${location.pathname}${location.search}` } })
        return false
    }

    const runLaunch = async (id, path, body, { collectOnReturn = false, topLevel = false, title = 'Game' } = {}) => {
        if (!requireLogin()) return
        if (topLevel && isExchangeGameTabOpen()) {
            setError('Close the current 9 Wickets tab before opening another session.')
            return
        }
        // React state is not synchronous, so a fast double tap could submit two
        // 9W launches before the button became disabled. The second provider
        // session invalidates the first one and produces the "login again"
        // screen. A ref closes that gap immediately.
        if (launchInFlight.current) return
        launchInFlight.current = true

        setError('')
        setLaunchingId(id)
        const embeddedToken = topLevel ? '' : beginEmbeddedGame({ title })
        let gameTab = null

        try {
            if (topLevel) {
                // Reserve the tab during the click. Browsers block windows
                // opened only after the asynchronous launch request finishes.
                rememberExchangeReturnPath(body.return_path)
                gameTab = window.open('about:blank', '_blank')
                if (!gameTab) throw new Error('Please allow a new tab for 9 Wickets and try again.')
                gameTab.opener = null
                markGameAway()
                watchExchangeGameTab(gameTab)
            }
            if (topLevel) await waitForExchangeRelaunch()
            const response = await api.post(path, { platform: platformCode(), language: 'en', ...body })
            // The provider transfer has already committed when this response
            // arrives. Keep the recovery marker even if its URL is unusable.
            if (collectOnReturn && response.data?.transfer_id) rememberExchangeWallet(user?.wallet, response.data.transfer_id, gameTab)
            const gameUrl = validatedGameLaunchUrl(response.data?.game_url)
            rememberGameOrigin(gameUrl)

            if (topLevel) {
                if (gameTab.closed) throw new Error('The 9 Wickets tab was closed before the game opened.')
                gameTab.location.replace(gameUrl)
            } else {
                openEmbeddedGame({ url: gameUrl, title, token: embeddedToken })
            }
        } catch (launchError) {
            // The backend can report a committed transfer without a launch URL.
            // Preserve the marker so closing this tab starts a real collection.
            if (collectOnReturn && launchError.payload?.errors?.funds_transferred) {
                rememberExchangeWallet(user?.wallet, launchError.payload?.errors?.transfer_id, gameTab)
            }
            if (gameTab && !gameTab.closed) gameTab.close()
            if (topLevel) {
                returnFromGame({ force: true })
                requestAccountRefresh()
            }
            if (embeddedToken) cancelEmbeddedGame(embeddedToken)
            setError(launchError.message || 'Unable to launch this game right now.')
        } finally {
            launchInFlight.current = false
            setLaunchingId('')
        }
    }

    return {
        error,
        clearError: () => setError(''),
        launchingId,
        launchGame: (game) => runLaunch(
            game.uid,
            '/api/9w/launch',
            { game_uid: game.uid, wallet_mode: 'both' },
            { title: game.name || 'Casino Game' },
        ),
        launchSportsbook: (provider, title = `${String(provider).toUpperCase()} Sports`) => provider === '9w'
            ? runLaunch('sports-9w', '/api/9wicket/launch', {
                page: 'highlight',
                return_path: `${location.pathname}${location.search}${location.hash}`,
            }, { collectOnReturn: true, topLevel: true, title: '9Wickets' })
            : runLaunch(`sports-${provider}`, '/api/9w/launch-sportsbook', {
                provider, wallet_mode: 'both',
            }, { title }),
    }
}
