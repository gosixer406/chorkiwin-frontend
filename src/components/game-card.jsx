import { Link } from 'react-router-dom'
import game_img from '@/assets/img/game-img.png'
import GameImage from '@/components/game-image'

export default function GameCard({ className = "aspect-square", item, onLaunch, launching = false, priority = false }) {
    const content = (
        <GameImage
            src={item.img}
            fallback={item.fallbackImg}
            placeholder={game_img}
            alt={item.name || 'Casino game'}
            priority={priority}
            className='size-full object-cover object-center'
        />
    )

    if (onLaunch) {
        return (
            <button
                type="button"
                onClick={onLaunch}
                disabled={launching}
                aria-label={`Play ${item.name || 'casino game'}`}
                className={`mx-auto block w-[94%] relative rounded-xl overflow-hidden hover:opacity-95 hover:scale-99 bg-amber-50 disabled:cursor-wait ${className}`}
            >
                {content}
            </button>
        )
    }

    return (
        <Link to={item.path || '#'} className={`mx-auto block w-[94%] relative rounded-xl overflow-hidden hover:opacity-95 hover:scale-99 bg-amber-50 ${className}`}>
            {content}
        </Link>
    )
}
