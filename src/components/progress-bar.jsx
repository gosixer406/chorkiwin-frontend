
export default function ProgressBar({ className = '', value }) {
    return (
        <div className={`w-full h-1.5 bg-[#093c5a] rounded-full ${className}`}>
            <div className="h-full rounded-full bg-linear-45 from-[#26A9B7] to-[#42DDEE]" style={{ width: `${value}%` }}></div>
        </div>
    )
}
