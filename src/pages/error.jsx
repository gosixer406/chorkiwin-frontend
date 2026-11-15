
import { useState } from 'react'
import Preloader from '../components/preloader'
import { recoverByReload } from '../lib/error-recovery'
import { ArrowRight } from '../utilities/icons/arrow-right'

// Unknown URLs redirect home in App.jsx, so this only ever shows for a crash or a
// page that failed to load. Most of those clear up with a reload.
export default function Error() {
    const [recovering] = useState(recoverByReload)

    if (recovering) return <Preloader />

    return (
        <div className='w-full h-screen flex flex-col justify-center items-center bg-page text-white'>
            <h2 className='text-3xl text-white'>Something went wrong</h2>
            <button onClick={() => window.location.replace('/')} className="btn-new mt-4 px-6 hover:[&_svg]:-translate-x-1.5">
                <ArrowRight className="size-3 -scale-x-100" />
                Back to home
            </button>
        </div>
    )
}
