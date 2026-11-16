// Casino games open in their own browser tab instead of a frame on the site,
// the way gamex24 does it: the click opens this site's /open-game/... page in
// that tab, which shows the top bar (logo and close) while it asks the backend
// for the launch URL, then moves the tab on to the provider.
//
//   * One tab for every casino game (a named window): opening another game
//     replaces the one running, so two SoftAPI sessions never share a balance.
//   * While that tab is open the site is "away on a game", so the 5-minute
//     away sign-out does not end the player's session.
//   * When the tab closes (or the provider sends the player back to the site)
//     the game session is closed and the wallet refreshed.
import { api } from '@/lib/api'
import { markGameAway, markSeen, returnFromGame } from '@/lib/away-logout'
import { requestAccountRefresh } from '@/lib/refresh-account'

const TAB_NAME = 'velki_casino_game'
const WATCH_MS = 1000
export const OPEN_GAME_PREFIX = '/open-game/'

let gameTab = null
let watcher = 0

/** `/open-game/<platform>/<game uid>?name=<game name>` */
export function openGamePath({ uid, name = 'Game', platform = 1 }) {
    return `${OPEN_GAME_PREFIX}${platform}/${encodeURIComponent(uid)}?name=${encodeURIComponent(name || 'Game')}`
}

// The provider sent the player back to this site inside the game tab: the game is over.
// The /open-game page itself is this site too, but the game has not started yet.
function backOnSite(tab) {
    try {
        const { href, origin, pathname } = tab.location
        return href !== 'about:blank' && origin === window.location.origin && !pathname.startsWith(OPEN_GAME_PREFIX)
    } catch {
        return false // the live provider page is cross-origin
    }
}

function finish() {
    window.clearInterval(watcher)
    watcher = 0
    gameTab = null
    returnFromGame({ force: true })
    markSeen()
    api.post('/api/9w/close', {}).catch(() => {})
    requestAccountRefresh()
}

/**
 * Open the game tab on /open-game/... and watch it until the player leaves.
 * Must run synchronously inside the click: browsers block windows opened
 * after an awaited request. Returns null when the browser refused (popup
 * blocker, in-app webview); the caller then opens the game on the site.
 */
export function openCasinoGameTab(game) {
    let tab
    try {
        tab = window.open(openGamePath(game), TAB_NAME)
    } catch {
        return null
    }
    if (!tab) return null
    try {
        tab.focus()
    } catch {
        /* Focus is a hint only. */
    }
    gameTab = tab
    markGameAway()
    window.clearInterval(watcher)
    watcher = window.setInterval(() => {
        if (gameTab !== tab) return
        if (tab.closed || backOnSite(tab)) return finish()
        // Keep the away sign-out off while the game is open; a hidden page's
        // timer may run only once a minute, the flag only has to stay set.
        markGameAway()
    }, WATCH_MS)
    return tab
}

export const casinoGameTabOpen = () => !!gameTab && !gameTab.closed
