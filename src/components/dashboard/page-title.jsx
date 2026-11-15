import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

export default function PageTitle({ title, titleClass = 'text-base font-medium', className = "bg-black text-[#EFF4F6]", onClick }) {
    const navigate = useNavigate()
    return (
        <div className={`page-title flex items-center justify-center px-4 min-h-13 ${className}`}>
            <strong className={`${titleClass} leading-[130%] mx-auto`}>{title}</strong>
            <button type="button" aria-label={`Close ${title}`} onClick={() => {
                if (onClick) {
                    onClick()
                } else {
                    navigate(-1)
                }
            }}>
                <X className='size-5' />
            </button>
        </div>
    )
}
