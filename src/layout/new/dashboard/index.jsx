import { Outlet } from 'react-router-dom'

export default function Index() {
    return (
        <div className="new-version-shell mx-auto flex min-h-screen w-full max-w-[430px] flex-col gap-y-0 bg-page font-inter text-sm text-white">
            <Outlet />
        </div>
    )
}
