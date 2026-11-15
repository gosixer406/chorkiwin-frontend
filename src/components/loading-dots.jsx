// Balance placeholder while the header refreshes (same dots as the admin header).
export default function LoadingDots({ className = '' }) {
    return (
        <span className={`loading-dots ${className}`} role="status" aria-label="Loading">
            {Array.from({ length: 8 }, (_, index) => (
                <i key={index} style={{ animationDelay: `${index * 0.1}s` }} />
            ))}
        </span>
    )
}
