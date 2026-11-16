import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import logo from '@/assets/img/logo/short_logo_3d.png'
import { loginBannerSrc, useLoginBanner } from '@/lib/login-banner'

// Login and signup share this layout, so both show the same banner: the one
// set in Admin > CMS > Login Banner. With no banner set (or until it is known,
// or if it fails to load) the space stays empty: no stand-in image.
function Banner() {
    const { banner } = useLoginBanner()
    const [failedSrc, setFailedSrc] = useState('')
    const src = loginBannerSrc(banner)
    if (!src || src === failedSrc) return null
    const link = banner?.link_url

    const image = (
        <img
            src={src}
            className="block h-auto w-full"
            alt=""
            decoding="async"
            fetchpriority="high"
            onError={() => setFailedSrc(src)}
        />
    )

    if (!link) return <div className="pointer-events-none">{image}</div>
    if (link.startsWith('/')) return <Link to={link} aria-label="Banner" className="block">{image}</Link>
    return <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Banner" className="block">{image}</a>
}

export default function Index() {
    return (
        <div className="app-shell new-version-shell mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#272727] pb-[66px] font-inter text-sm leading-[21px] text-white">
            <div className="relative shrink-0 overflow-hidden">
                <div className="flex items-center justify-between bg-bar px-2 py-[9px] pt-[calc(0.5625rem+env(safe-area-inset-top))]">
                    <img src={logo} className="ml-2 h-9 w-32 shrink-0 origin-left scale-125 object-contain object-left" alt="chorkix.com" />
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
                <Banner />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-[#272727] to-transparent" />
            </div>
            <Outlet />
        </div>
    )
}
