import Loader from '@/components/loader'

export default function SportsbookLaunchLoader({ label = 'Opening Sports' }) {
    return (
        <span
            role="status"
            aria-label={label}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 transition-all"
        >
            <span className="loading-body flex items-center justify-center rounded-lg bg-[#1b1f23b3] p-8">
                <Loader label="" className="" data-launch-loader="" />
            </span>
        </span>
    )
}
