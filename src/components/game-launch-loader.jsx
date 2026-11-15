// "PLEASE WAIT" card with dancing dots, shown while a game is launching
// (same loader as gamex24's game launcher). Styles: .game-launch-* in index.css.
const DOTS = Array.from({ length: 14 }, (_, index) => index)

export default function GameLaunchLoader({ overlay = false, className = '' }) {
    return (
        <div
            className={`game-launch-wait${overlay ? ' overlay' : ''} ${className}`}
            role="status"
            aria-label="Please wait"
        >
            <div className="game-launch-wait-card">
                <div className="game-launch-wait-title">PLEASE WAIT</div>
                <div className="game-launch-wait-dots" aria-hidden="true">
                    {DOTS.map((dot) => <span key={dot} />)}
                </div>
            </div>
        </div>
    )
}
