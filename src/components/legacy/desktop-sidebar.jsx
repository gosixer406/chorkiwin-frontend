import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import logo from '@/assets/img/new/logo.png'

export default function LegacyDesktopSidebar() {
    return createPortal(
        <aside
            aria-label="Light theme home"
            className="fixed inset-y-0 left-0 z-0 hidden w-[calc((100vw-30rem)/2)] items-center justify-center md:flex"
        >
            <Link to="/" className="block w-[min(21.875rem,calc(100%-2rem))]">
                <img src={logo} alt="Chorkiwala" className="h-auto w-full object-contain" />
            </Link>
        </aside>,
        document.body,
    )
}
