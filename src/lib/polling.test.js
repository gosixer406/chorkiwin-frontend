import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { responseCacheTtl } from './cache-policy.js'
import { BALANCE_POLL_MS, CURRENT_BETS_POLL_MS, shouldSyncOnReturn, startPolling } from './polling.js'

function fakePage(visibilityState = 'visible') {
    const listeners = new Map()
    const target = () => ({
        addEventListener: (name, fn) => listeners.set(name, fn),
        removeEventListener: (name) => listeners.delete(name),
    })
    const page = {
        listeners,
        interval: null,
        win: {
            ...target(),
            setInterval(fn, ms) {
                page.interval = { fn, ms }
                return 1
            },
            clearInterval() {
                page.interval = null
            },
        },
        doc: { ...target(), visibilityState },
    }
    return page
}

const settled = () => new Promise((resolve) => setImmediate(resolve))

describe('startPolling', () => {
    it('uses the requested interval', () => {
        const page = fakePage()
        startPolling(async () => {}, BALANCE_POLL_MS, page)
        assert.equal(page.interval.ms, 5_000)
        assert.equal(CURRENT_BETS_POLL_MS, 10_000)
    })

    it('sends nothing from a hidden tab', async () => {
        const page = fakePage('hidden')
        let calls = 0
        startPolling(async () => { calls += 1 }, 1000, page)
        await page.interval.fn()
        await page.listeners.get('focus')()
        assert.equal(calls, 0)
    })

    it('refreshes when the player comes back to the tab', async () => {
        const page = fakePage('hidden')
        let calls = 0
        startPolling(async () => { calls += 1 }, 1000, page)
        page.doc.visibilityState = 'visible'
        await page.listeners.get('visibilitychange')()
        assert.equal(calls, 1)
    })

    it('does not overlap a request still in flight', async () => {
        const page = fakePage()
        let calls = 0
        let finish
        startPolling(() => {
            calls += 1
            return new Promise((resolve) => { finish = resolve })
        }, 1000, page)
        page.interval.fn()
        page.interval.fn()
        page.listeners.get('focus')()
        assert.equal(calls, 1)
        finish()
        await settled()
        page.interval.fn()
        assert.equal(calls, 2)
    })

    it('collapses the events of one tab return into one request', async () => {
        const page = fakePage()
        let calls = 0
        startPolling(async () => {
            calls += 1
            await settled()
        }, 1000, page)
        page.listeners.get('focus')()
        page.listeners.get('pageshow')()
        page.listeners.get('visibilitychange')()
        assert.equal(calls, 1)
    })

    it('keeps polling after a failed request', async () => {
        const page = fakePage()
        let calls = 0
        startPolling(async () => {
            calls += 1
            throw new Error('network')
        }, 1000, page)
        await page.interval.fn()
        await page.interval.fn()
        assert.equal(calls, 2)
    })

    it('stops completely, also for a call still queued', async () => {
        const page = fakePage()
        let calls = 0
        const poller = startPolling(async () => { calls += 1 }, 1000, page)
        const tick = page.interval.fn
        poller.stop()
        await tick()
        assert.equal(calls, 0)
        assert.equal(page.interval, null)
        assert.equal(page.listeners.size, 0)
    })
})

describe('shouldSyncOnReturn', () => {
    const now = 1_000_000

    it('skips a return inside the gap', () => {
        assert.equal(shouldSyncOnReturn({ now, lastSyncAt: now - 30_000, exchangeActive: false }), false)
    })

    it('syncs once the gap has passed', () => {
        assert.equal(shouldSyncOnReturn({ now, lastSyncAt: now - 60_000, exchangeActive: false }), true)
    })

    it('syncs the first return of a session', () => {
        assert.equal(shouldSyncOnReturn({ now, lastSyncAt: 0, exchangeActive: false }), true)
    })

    it('does not collect a still-open game when the site tab gains focus', () => {
        assert.equal(shouldSyncOnReturn({ now, lastSyncAt: 0, exchangeActive: true }), false)
    })
})

describe('responseCacheTtl', () => {
    it('holds site content for a minute', () => {
        for (const path of ['/api/home-sections', '/api/notices', '/api/promotions']) {
            assert.equal(responseCacheTtl(path), 60_000)
        }
    })

    it('keeps the catalogue cache as it was', () => {
        assert.equal(responseCacheTtl('/api/9w/hall/games?x=1'), 300_000)
        assert.equal(responseCacheTtl('/api/sports/providers'), 60_000)
    })

    it('never caches money or account data', () => {
        for (const path of ['/api/wallet/balance?live_exposure=1', '/api/auth/me', '/api/sports/current-bets', '/api/betting/history']) {
            assert.equal(responseCacheTtl(path), 0)
        }
    })
})
