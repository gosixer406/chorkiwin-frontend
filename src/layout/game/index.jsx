import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../header'
import Footer from '../footer'
import LegacyDesktopSidebar from '../../components/legacy/desktop-sidebar'

export default function Index() {
    const { pathname } = useLocation();

    useEffect(() => {
        const mainBody = document.querySelector('.scroll_body');
        if (mainBody) {
            mainBody.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }
    }, [pathname]);


    return (
        <div className='bg-background min-h-screen flex flex-col font-ubuntu'>
            <LegacyDesktopSidebar />
            <Header />
            <div className="scroll_body no-scrollbar flex max-h-[calc(100vh-44px)] flex-col gap-y-0 overflow-auto pb-13">
                <Outlet />
                <Footer />
            </div>
        </div>
    )
}
