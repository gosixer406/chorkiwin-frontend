import { Link, Outlet } from 'react-router-dom'

import banner from '@/assets/img/logo/login-banner.png'
import logo from '@/assets/img/logo/short_logo_3d.png'

export default function Index() {
    return (
        <div className="app-shell new-version-shell mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#272727] pb-[66px] font-inter text-sm leading-[21px] text-white">
            <div className="relative shrink-0 overflow-hidden">
                <div className="flex items-center justify-between bg-bar px-2 py-[9px] pt-[calc(0.5625rem+env(safe-area-inset-top))]">
                    <img src={logo} className="ml-3 h-8 w-28 shrink-0 origin-left scale-125 object-contain object-left" alt="chorkix.com" />
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
                <img src={banner} className="pointer-events-none block h-auto w-full" alt="" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-[#272727] to-transparent" />
            </div>
            <Outlet />
        </div>
    )
}
