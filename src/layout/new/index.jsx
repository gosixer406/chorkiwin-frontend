import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from "./header"
import Footer from "./footer"
import Nav from "./nav"
import Support from '../../components/support'

export default function Index() {
    const router = useLocation();
    const mainRef = useRef(null);
    useEffect(() => { mainRef.current?.scrollTo(0, 0) }, [router.pathname])
    const is_profile = !['/profile', '/upline-whatsapp', '/agent-list', '/promotions/'].some((path) => router.pathname.includes(path));
    return (
        <>
            <Support className="mb-24" />
            <div className='new-version-shell relative z-1 mx-auto flex h-dvh min-h-0 w-full max-w-[430px] flex-col gap-y-0 overflow-hidden bg-page font-inter text-sm text-white'>
                {is_profile &&
                    <Header />
                }
                <main ref={mainRef} className={`${is_profile ? 'py-2 px-2' : 'py-0 px-0'} min-h-0 flex-1 overflow-y-auto pb-12`}>
                    <Outlet />
                    {is_profile &&
                        <Footer />
                    }
                </main>
                <Nav className="mt-auto" />
            </div>
        </>
    )
}
