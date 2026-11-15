export default function CommonInner({ className, children }) {
    return (
        <div className={`py-6 bg-background min-h-[calc(100vh-92px)] overflow-auto px-4 rounded-t-[10px] ${className}`}>
            {children}
        </div>
    )
}
