// Signs the player out once no tab of the site has been on screen for AWAY_LIMIT_MS
// (tab hidden, browser minimised or closed). Every visible tab stamps a shared
// "last seen" time, so switching between two site tabs never counts as leaving.
export const AWAY_LIMIT_MS = 5 * 60_000 // 5 minutes

const LAST_SEEN_KEY = 'velki_last_seen'
const GAME_AWAY_KEY = 'velki_game_away'

function read(key) {
    try { return Number(localStorage.getItem(key)) || 0 } catch { return 0 }
}

function write(key, value) {
    try {
        if (value) localStorage.setItem(key, String(value))
        else localStorage.removeItem(key)
    } catch { /* storage unavailable */ }
}

export function markSeen() {
    write(LAST_SEEN_KEY, Date.now())
}

export function clearSeen() {
    write(LAST_SEEN_KEY, 0)
}

// A top-level game launch (9W exchange) leaves the site on purpose; the player
// must still be signed in when the provider sends them back.
export function markGameAway() {
    write(GAME_AWAY_KEY, Date.now())
}

export function isAwayTooLong() {
    if (read(GAME_AWAY_KEY)) return false
    const lastSeen = read(LAST_SEEN_KEY)
    return lastSeen > 0 && Date.now() - lastSeen > AWAY_LIMIT_MS
}

// Back on the site: the game exemption has done its job. A just-set flag is kept,
// since the page is still visible for a moment while the browser leaves for the game.
export function returnFromGame({ force = false } = {}) {
    const awaySince = read(GAME_AWAY_KEY)
    if (awaySince && (force || Date.now() - awaySince > 5_000)) write(GAME_AWAY_KEY, 0)
}
