import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const PROMPT_STORAGE_PREFIX = 'velki:pwa-install-prompt-seen:v4:'
const INSTALLED_STORAGE_KEY = 'pwaInstalled'

export default function PwaInstallBar() {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const user = useSelector((state) => state.auth.user)
    const [promptEvent, setPromptEvent] = useState(null)
    const [shownForKey, setShownForKey] = useState(null)
    const [guestDismissed, setGuestDismissed] = useState(false)
    const userKey = String(user?.id || user?.username || 'authenticated-user')
    const promptStorageKey = `${PROMPT_STORAGE_PREFIX}${userKey}`
    const isInstalled = window.matchMedia?.('(display-mode: standalone)').matches
        || window.navigator.standalone === true
    const isEligible = !isInstalled
    const isShown = isEligible && (
        isLoggedIn
            ? shownForKey === promptStorageKey
            : !guestDismissed
    )

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').catch(() => undefined)
        }

        const handlePrompt = (event) => {
            event.preventDefault()
            setPromptEvent(event)
        }
        const handleInstalled = () => {
            window.localStorage.setItem(INSTALLED_STORAGE_KEY, '1')
            setShownForKey(null)
            setPromptEvent(null)
        }

        window.addEventListener('beforeinstallprompt', handlePrompt)
        window.addEventListener('appinstalled', handleInstalled)
        return () => {
            window.removeEventListener('beforeinstallprompt', handlePrompt)
            window.removeEventListener('appinstalled', handleInstalled)
        }
    }, [])

    useEffect(() => {
        if (
            !isEligible
            || !isLoggedIn
            || shownForKey === promptStorageKey
            || window.localStorage.getItem(promptStorageKey) === '1'
        ) return undefined

        // Remember the first authenticated display on this device. Refreshing
        // the page, returning from a game, or signing in again will not reopen it.
        const timer = window.setTimeout(() => {
            window.localStorage.setItem(promptStorageKey, '1')
            setShownForKey(promptStorageKey)
        }, 250)
        return () => window.clearTimeout(timer)
    }, [isEligible, isLoggedIn, promptStorageKey, shownForKey])

    useEffect(() => {
        if (!isShown) return undefined

        const previousPaddingTop = document.body.style.paddingTop
        const alreadyHadVisibleClass = document.body.classList.contains('pwa-install-visible')
        document.body.style.paddingTop = '56px'
        document.body.classList.add('pwa-install-visible')
        return () => {
            document.body.style.paddingTop = previousPaddingTop
            if (!alreadyHadVisibleClass) document.body.classList.remove('pwa-install-visible')
        }
    }, [isShown])

    const close = () => {
        if (isLoggedIn) {
            window.localStorage.setItem(promptStorageKey, '1')
            setShownForKey(null)
        } else {
            setGuestDismissed(true)
        }
    }

    const install = async () => {
        if (!promptEvent) {
            window.alert('To install Chorkiwala, open your browser menu and choose “Install app” or “Add to Home screen”.')
            return
        }

        await promptEvent.prompt()
        const choice = await promptEvent.userChoice
        if (choice.outcome === 'accepted') {
            window.localStorage.setItem(INSTALLED_STORAGE_KEY, '1')
            close()
        }
        setPromptEvent(null)
    }

    if (!isShown) return null

    return (
        <aside
            aria-label="Install Chorkiwala application"
            className="fixed inset-x-0 top-0 z-[99999] mx-auto flex h-14 w-full max-w-[430px] items-center border-b border-line bg-[linear-gradient(90deg,var(--c-page)_0%,var(--c-surface)_60%,var(--c-surface-2)_100%)] px-3 shadow-[0_2px_10px_rgba(0,0,0,0.35)] font-sans text-white"
        >
            <button type="button" onClick={close} aria-label="Close app install prompt" className="mr-3 shrink-0 border-0 bg-transparent p-0 text-[22px] font-normal leading-none text-white">✕</button>
            <img src="/favicon.png" alt="Chorkiwala" width="28" height="28" className="mr-3 size-8 shrink-0 rounded-lg object-fill ring-1 ring-gold/40" />
            <div className="min-w-0 flex-1 leading-[1.2]">
                <strong className="block text-sm font-bold">Chorkiwala App</strong>
                <span className="block truncate text-xs text-ink-muted">Install our app for faster access!.</span>
            </div>
            <button type="button" onClick={install} className="ml-2 shrink-0 rounded-md border-0 bg-[linear-gradient(180deg,var(--c-gold-light)_0%,var(--c-gold)_45%,var(--c-gold-dark)_100%)] px-[18px] py-2 text-sm font-bold text-on-gold shadow-[0_0_10px_color-mix(in_srgb,var(--c-gold)_45%,transparent)]">Install</button>
        </aside>
    )
}
