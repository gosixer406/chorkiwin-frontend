import { ChevronLeft } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import logo from '@/assets/img/auth/logo.png'
import loginBanner from '@/assets/img/auth/custom-login-banner.png'
import authImage from '@/assets/img/auth/auth-bg.png'
import desktopBackground from '@/assets/img/bg.png'

export default function Index() {
    const navigate = useNavigate()

    return (
        <section className="relative isolate min-h-dvh w-full overflow-y-auto bg-white font-ubuntu no-scrollbar">
            <img
                src={desktopBackground}
                alt=""
                className="pointer-events-none fixed inset-0 -z-20 hidden size-full object-cover object-center md:block"
            />
            <img
                src={authImage}
                alt=""
                className="pointer-events-none absolute inset-0 -z-10 size-full object-cover object-center"
            />

            <button
                type="button"
                aria-label="Go back"
                onClick={() => navigate(-1)}
                className="absolute left-4 top-4 z-50 flex size-9 cursor-pointer items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg"
            >
                <ChevronLeft className="size-9 text-gray-800" />
            </button>

            <div className="flex min-h-dvh w-full items-center justify-center">
                <div className="flex min-h-dvh w-full flex-col">
                    <div className="flex flex-1 flex-col items-center justify-end px-4 pt-4">
                        <Link to="/" aria-label="Logo" className="mb-4 block w-60 md:w-65">
                            <img src={logo} className="h-auto w-full object-contain" alt="Logo" />
                        </Link>

                        <div className="-mx-4 w-[calc(100%+2rem)] max-w-none md:mx-0 md:w-full md:max-w-md">
                            <a
                                href="https://wa.me/+447478032883"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Banner"
                                className="block w-full"
                            >
                                <img
                                    src={loginBanner}
                                    className="block h-auto w-full rounded-none border-y border-white/10 shadow-lg md:mb-[5px] md:rounded-xl md:border"
                                    alt="Banner"
                                />
                            </a>
                        </div>
                    </div>

                    <div className="relative z-10 -mt-2 w-full shrink-0 rounded-t-[15px] bg-white shadow-2xl">
                        <Outlet />
                    </div>
                </div>
            </div>
        </section>
    )
}
