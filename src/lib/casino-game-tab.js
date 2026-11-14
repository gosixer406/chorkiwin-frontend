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

const TAB_NAME = 'velki_casino_game'
const WATCH_MS = 1000

let gameTab = null
let watcher = 0

// "PLEASE WAIT" card with dancing dots, shown in the game tab while the launch
// request runs (same loader as gamex24).
const WAIT_DOTS = [
    [8, 8, '#a9d0e4'], [23, 8, '#c9e0ec'], [38, 9, '#eef7fb'], [53, 17, '#8fbfda'], [66, 22, '#006faf'],
    [80, 14, '#0067a5'], [93, 12, '#006faf'], [8, 32, '#006faf'], [24, 32, '#006faf'], [40, 27, '#006faf'],
    [55, 21, '#006faf'], [74, 32, '#6da9ce'], [88, 32, '#197db7'], [102, 32, '#006faf'],
]
const WAIT_DOTS_CSS = WAIT_DOTS.map(([left, top, bg], i) => (
    `.wait-dots span:nth-child(${i + 1}){left:${left}px;top:${top}px;background:${bg};animation-delay:${(i * 0.06).toFixed(2)}s}`
)).join('')

const LOADING_HTML = '<!doctype html><html><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    + '<meta name="theme-color" content="#ffffff"><meta name="color-scheme" content="light">'
    + '<title>Please wait…</title><style>'
    + '*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;min-height:100dvh;overflow:hidden;background:#fff}'
    + '.wait-loader{position:fixed;inset:0;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#fff}'
    + '.wait-card{width:min(90vw,430px);height:clamp(330px,52dvh,430px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(35px,7vw,48px);border-radius:clamp(24px,7.466667vw,30px);background:#fff;box-shadow:0 16px 35px rgba(0,0,0,.22)}'
    + '.wait-title{color:#006faf;font-family:Arial,"Helvetica Neue",sans-serif;font-size:clamp(30px,8.8vw,44px);font-weight:400;line-height:1;letter-spacing:.15em;text-indent:.15em}'
    + '.wait-dots{position:relative;width:112px;height:44px}'
    + '.wait-dots span{position:absolute;width:6.5px;height:6.5px;border-radius:50%;background:#006faf;animation:dotDance 1.08s ease-in-out infinite;box-shadow:0 0 3px rgba(0,111,175,.2)}'
    + WAIT_DOTS_CSS
    + '@keyframes dotDance{0%,100%{opacity:.42;transform:translate3d(0,0,0) scale(.82)}45%{opacity:1;transform:translate3d(0,-8px,0) scale(1.15)}}'
    + '@media(prefers-reduced-motion:reduce){.wait-dots span{animation:none}}'
    + '</style></head><body>'
    + '<div class="wait-loader" role="status" aria-label="Please wait"><div class="wait-card">'
    + '<div class="wait-title">PLEASE WAIT</div>'
    + `<div class="wait-dots" aria-hidden="true">${'<span></span>'.repeat(WAIT_DOTS.length)}</div>`
    + '</div></div></body></html>'

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
    try {
        tab.document.open()
        tab.document.write(LOADING_HTML)
        tab.document.close()
    } catch {
        /* Not writable: the blank tab still works. */
    }
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
