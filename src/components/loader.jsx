// In-page loader for a section or list. Full-screen loads use Preloader instead.
// Pass label="" for just the ring. Renders a span so it is valid inside buttons.
export default function Loader({ label = 'Loading...', className = 'py-12', ...props }) {
    return (
        <span
            role={label ? 'status' : undefined}
            aria-hidden={label ? undefined : true}
            className={`flex flex-col items-center justify-center gap-4 text-center text-sm tracking-wide text-ink-soft ${className}`}
            {...props}
        >
            <span aria-hidden="true" className="block size-10 animate-spin rounded-full border-[3px] border-primary2/20 border-t-primary2" />
            {label && <span>{label}</span>}
        </span>
    )
}
