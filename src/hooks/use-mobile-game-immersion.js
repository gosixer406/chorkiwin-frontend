import { useCallback, useEffect, useRef, useState } from 'react'

function currentFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null
}

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches
}

export default function useMobileGameImmersion() {
    const containerRef = useRef(null)
    const touchStartY = useRef(null)
    const [immersive, setImmersive] = useState(false)

    const ownsFullscreen = useCallback(() => {
        const container = containerRef.current
        const fullscreenElement = currentFullscreenElement()
        return Boolean(
            container
            && fullscreenElement
            && (fullscreenElement === container || container.contains(fullscreenElement))
        )
    }, [])

    const enterImmersive = useCallback(async () => {
        const container = containerRef.current
        if (!container || !isMobileViewport()) return

        const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen
        if (requestFullscreen) {
            try {
                await requestFullscreen.call(container, { navigationUI: 'hide' })
            } catch {
                try {
                    await requestFullscreen.call(container)
                } catch {
                    // iOS and embedded browsers may not expose element
                    // fullscreen. CSS immersive mode still removes our header.
                }
            }
        }
        setImmersive(true)
    }, [])

    const leaveImmersive = useCallback(() => {
        setImmersive(false)
        if (!ownsFullscreen()) return
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen
        if (exitFullscreen) {
            try {
                const result = exitFullscreen.call(document)
                result?.catch?.(() => {})
            } catch {
                // The browser may already be processing its own swipe/back exit.
            }
        }
    }, [ownsFullscreen])

    useEffect(() => {
        const syncFullscreenState = () => {
            if (!isMobileViewport()) {
                setImmersive(false)
                return
            }
            setImmersive(ownsFullscreen())
        }
        document.addEventListener('fullscreenchange', syncFullscreenState)
        document.addEventListener('webkitfullscreenchange', syncFullscreenState)
        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState)
            document.removeEventListener('webkitfullscreenchange', syncFullscreenState)
        }
    }, [ownsFullscreen])

    const onExitTouchStart = useCallback((event) => {
        touchStartY.current = event.changedTouches?.[0]?.clientY ?? null
    }, [])

    const onExitTouchEnd = useCallback((event) => {
        const endY = event.changedTouches?.[0]?.clientY
        if (touchStartY.current !== null && endY - touchStartY.current >= 42) {
            leaveImmersive()
        }
        touchStartY.current = null
    }, [leaveImmersive])

    return {
        containerRef,
        immersive,
        enterImmersive,
        leaveImmersive,
        exitGestureProps: {
            onTouchStart: onExitTouchStart,
            onTouchEnd: onExitTouchEnd,
        },
    }
}
