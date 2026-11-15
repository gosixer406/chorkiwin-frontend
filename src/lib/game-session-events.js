export const OPEN_GAME_EVENT = 'velki:open-game'
export const CLOSE_GAME_EVENT = 'velki:close-game'

let activeLaunchToken = ''

export function beginEmbeddedGame({ title = 'Game' } = {}) {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    activeLaunchToken = token
    window.dispatchEvent(new CustomEvent(OPEN_GAME_EVENT, {
        detail: { token, url: '', title },
    }))
    return token
}

export function openEmbeddedGame({ url, title = 'Game', token = '' }) {
    if (token && activeLaunchToken !== token) return false
    if (!token) activeLaunchToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.dispatchEvent(new CustomEvent(OPEN_GAME_EVENT, {
        detail: { token: token || activeLaunchToken, url, title },
    }))
    return true
}

export function cancelEmbeddedGame(token) {
    if (token && activeLaunchToken !== token) return
    activeLaunchToken = ''
    window.dispatchEvent(new CustomEvent(CLOSE_GAME_EVENT))
}

export function clearActiveEmbeddedGame() {
    activeLaunchToken = ''
}
