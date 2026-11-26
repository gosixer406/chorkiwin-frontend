import { useState } from 'react'
import { imageCandidates } from '@/lib/image-url'

// Game artwork for cards: a card-sized Cloudinary copy (WebP/AVIF, 1x/2x),
// falling back to the original URLs and finally `placeholder` on error.
// `priority` is for the first screen of cards: no lazy loading, high fetch priority.
export default function GameImage({ src, fallback, placeholder, alt = '', width = 180, priority = false, className = '' }) {
    const candidates = imageCandidates(width, src, fallback, placeholder)
    const key = candidates.map((candidate) => candidate.src).join('|')
    // The failed-candidate index belongs to one set of URLs; a new game starts at 0.
    const [failure, setFailure] = useState({ key, index: 0 })
    const index = failure.key === key ? failure.index : 0
    const current = candidates[Math.min(index, candidates.length - 1)]
    // Shimmer until this exact image has loaded, then fade it in, so a slow
    // card never shows a blank or half-drawn tile.
    const [loadedSrc, setLoadedSrc] = useState('')
    const loaded = Boolean(current) && loadedSrc === current.src

    if (!current) return placeholder ? <img src={placeholder} alt={alt} className={className} /> : null
    return (
        <img
            src={current.src}
            srcSet={current.srcSet}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={() => setLoadedSrc(current.src)}
            onError={() => setFailure({ key, index: Math.min(index + 1, candidates.length - 1) })}
            className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'animate-pulse bg-surface-2 opacity-60'}`}
        />
    )
}
