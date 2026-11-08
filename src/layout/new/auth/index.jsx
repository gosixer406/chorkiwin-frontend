import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import logo from '@/assets/img/new/chorkiwala-logo.png'
import { api, apiAssetUrl } from '@/lib/api'
import { useTheme } from '@/lib/theme'

// Banner set by the White Label in admin (CMS > Login Banner), one image per
// theme (light is the default). Only the API banner is shown — no bundled
// fallback — and the response is cached for 5 minutes.
const BANNER_CACHE_KEY = 'velki_login_banner_v3'
const BANNER_CACHE_TTL = 5 * 60 * 1000

function readCachedEntry() {
    try {
        const entry = JSON.parse(localStorage.getItem(BANNER_CACHE_KEY) || 'null')
        return entry && typeof entry.at === 'number' ? entry : null
    } catch {
        return null
    }
}

function useLoginBanner() {
    const [banner, setBanner] = useState(() => readCachedEntry()?.banner ?? null)
    useEffect(() => {
        const cached = readCachedEntry()
        if (cached && Date.now() - cached.at < BANNER_CACHE_TTL) return
        let alive = true
        api.get('/api/site/login-banner', { auth: false })
            .then((response) => {
                const data = response?.data
                const light = data?.light_image_url || data?.image_url
                const dark = data?.dark_image_url || light
                const next = data?.show && light
                    ? { light: apiAssetUrl(light), dark: apiAssetUrl(dark), link: data.link_url || '' }
                    : null
                if (!alive) return
                setBanner(next)
                try {
                    localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify({ banner: next, at: Date.now() }))
                } catch {
                    // storage unavailable: the banner just reloads next time
                }
            })
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [])
    return banner
}

function BannerLink({ link, children }) {
    if (!link) return children
    if (link.startsWith('/')) return <Link to={link} className="block">{children}</Link>
    return <a href={link} target="_blank" rel="noopener noreferrer" className="block">{children}</a>
}

export default function Index() {
    const banner = useLoginBanner()
    const { theme } = useTheme()
    const [failed, setFailed] = useState('')
    const themed = banner ? (theme === 'dark' ? banner.dark : banner.light) : ''
    const src = themed && failed !== themed ? themed : ''
    const link = src ? banner.link : ''

    return (
        <div className="app-shell new-version-shell mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#272727] pb-[66px] font-inter text-sm leading-[21px] text-white">
            <div className="relative shrink-0 overflow-hidden">
                <div className="flex items-center justify-between bg-bar px-2 py-[9px] pt-[calc(0.5625rem+env(safe-area-inset-top))]">
                    <img src={logo} className="ml-3 h-8 w-28 shrink-0 origin-left scale-125 object-contain object-left" alt="Chorkiwala" />
                    <Link
                        to="/"
                        aria-label="Go back"
                        className="flex size-7 items-center justify-center rounded-sm bg-white/30 transition-colors hover:bg-white/50"
                    >
                        <svg className="size-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </Link>
                </div>
                {src && (
                    <>
                        <BannerLink link={link}>
                            <img
                                src={src}
                                onError={() => setFailed(themed)}
                                className={`block h-auto w-full ${link ? '' : 'pointer-events-none'}`}
                                alt=""
                            />
                        </BannerLink>
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-[#272727] to-transparent" />
                    </>
                )}
            </div>
            <Outlet />
        </div>
    )
}
