import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../header'
import Footer from '../footer'
import Support from '../../components/support'
import LegacyDesktopSidebar from '../../components/legacy/desktop-sidebar'

export default function Index() {
    const pathName = useLocation();
    useEffect(() => { window.scrollTo(0, 0) }, [pathName])

    return (
        <>
            <Support />
            <LegacyDesktopSidebar />
            <>
                <Header />
                <div className="scroll_body flex min-h-screen flex-col gap-y-0 overflow-auto bg-background pb-13 font-ubuntu">
                    <Outlet />
                    <Footer />
                </div>
            </>
        </>
    )
}
