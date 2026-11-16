// Casino games open in their own browser tab instead of a frame on the site.
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
import { showLaunchLoader } from '@/lib/launch-loader'

const TAB_NAME = 'velki_casino_game'
const WATCH_MS = 1000

let gameTab = null
let watcher = 0

/**
 * Open (or reuse) the game tab. Must run synchronously inside the click:
 * browsers block windows opened after an awaited request. Returns null when
 * the browser refused (popup blocker, in-app webview).
 */
export function reserveCasinoGameTab() {
    let tab
    try {
        tab = window.open('about:blank', TAB_NAME)
    } catch {
        return null
    }
    if (!tab) return null
    // The site's loader (same as the page Preloader) while the launch request
    // runs; the provider page replaces it.
    showLaunchLoader(tab, 'Opening game… - Chorki88')
    try {
        tab.opener = null
    } catch {
        /* Some browsers make opener read-only. */
    }
    return tab
}

/** The launch failed: drop the reserved tab. */
export function cancelCasinoGameTab(tab) {
    try {
        if (tab && !tab.closed) tab.close()
    } catch {
        /* Already gone. */
    }
}

// The provider sent the player back to this site inside the game tab: the game is over.
function backOnSite(tab) {
    try {
        return tab.location.href !== 'about:blank' && tab.location.origin === window.location.origin
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

/** Send the reserved tab to the game and watch it until the player leaves. */
export function showCasinoGame(tab, url) {
    tab.location.replace(url)
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
}

export const casinoGameTabOpen = () => !!gameTab && !gameTab.closed
