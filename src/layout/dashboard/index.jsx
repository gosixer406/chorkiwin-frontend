import Header from '../header'
import { Outlet } from 'react-router-dom'

export default function Index() {
    return (
        <>
            <Header />
            <div className="font-ubuntu">
                <div className="flex flex-col min-h-171 overflow-auto max-h-[calc(100vh-40px)]">
                    <Outlet />
                </div>
            </div>
        </>
    )
}
