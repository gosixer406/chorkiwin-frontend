import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Coins, Gift, Ticket, Trophy, Wallet, X } from 'lucide-react'
import { api } from '@/lib/api'
import { ACCOUNT_REFRESH_EVENT, requestAccountRefresh } from '@/lib/refresh-account'

// Loss spins only (White Label -> Spin Management), run by the backend:
//   GET  /api/bonus-spin/loss-spins       spins left, wheel, reward bands, my wins
//   POST /api/bonus-spin/loss-spins/play  the server picks a wheel slice and pays it
//   GET  /api/bonus-spin/board            recent winners on the site
// A spin exists only after the player's loss in the 24h after the day's first
// deposit reaches the lowest band, so without loss there is nothing to spin.
// The wheel only animates: the amount always comes from the server.
const CURRENCY = '$'
// The $1 - $100 wheel (same order as the backend's LOSS_SPIN_WHEEL); the
// server's list replaces it once loaded.
const DEFAULT_WHEEL = [1, 50, 3, 10, 6, 100, 2, 20, 8, 40, 4, 80, 7, 30, 5, 60, 9]
const SEGMENT_COLORS = ['#FFFFFF', '#F2545B', '#F7A928', 'var(--c-gold)', '#E84393', '#10AC84']
const SPIN_MS = 5200

const segmentColor = (index) => SEGMENT_COLORS[index % SEGMENT_COLORS.length]
const amountText = (value) => {
    const number = Number(value || 0)
    return `${CURRENCY}${Number.isInteger(number) ? number : number.toFixed(2)}`
}
const dateOnly = (value) => (value ? String(value).slice(0, 10) : '')

const buildPrizes = (wheel) => (Array.isArray(wheel) && wheel.length > 1 ? wheel : DEFAULT_WHEEL)
    .map((value) => ({ value: Number(value), label: amountText(value) }))

/** The player's loss spins. */
async function fetchMySpins() {
    try {
        const response = await api.get('/api/bonus-spin/loss-spins', { cache: 'no-store' })
        return { loss: response?.data || null, failure: '' }
    } catch (error) {
        return { loss: null, failure: error.message || 'Could not load your spins' }
    }
}

const spinsLeft = (mine) => Number(mine?.loss?.remaining_spins || 0)

/** The player's spins (when signed in) and the site's recent winners. */
async function fetchSpinData(isLoggedIn) {
    const [mine, board] = await Promise.all([
        isLoggedIn ? fetchMySpins() : { loss: null, failure: '' },
        api.get('/api/bonus-spin/board', { cache: 'no-store' }).catch(() => null),
    ])
    return { ...mine, board: board?.data || { winners: [] } }
}

// The slice whose value is closest to what the server paid.
const nearestPrize = (prizes, amount) => prizes.reduce(
    (best, prize, index) => (Math.abs(prize.value - amount) < Math.abs(prizes[best].value - amount) ? index : best),
    0,
)

const polar = (angle, radius) => {
    const rad = (angle * Math.PI) / 180
    return `${(Math.sin(rad) * radius).toFixed(3)} ${(-Math.cos(rad) * radius).toFixed(3)}`
}
const slicePath = (start, radius, segment) => `M0 0 L${polar(start, radius)} A${radius} ${radius} 0 0 1 ${polar(start + segment, radius)} Z`

function WheelFace({ prizes }) {
    const SEGMENT = 360 / prizes.length
    // Width available for a label at its radius, so long prize names are squeezed to fit.
    const labelRoom = 2 * 76 * Math.sin(((SEGMENT / 2) * Math.PI) / 180) * 0.85
    return (
        <svg viewBox="-100 -100 200 200" className="size-full" aria-hidden="true">
            {prizes.map((prize, index) => {
                const color = segmentColor(index)
                return (
                    <g key={index}>
                        <path d={slicePath(index * SEGMENT - SEGMENT / 2, 100, SEGMENT)} fill={color} />
                        <path d={slicePath(index * SEGMENT - SEGMENT / 2, 100, SEGMENT)} fill="url(#spin-shade)" />
                        <g transform={`rotate(${index * SEGMENT})`}>
                            <text
                                // Upright across the slice (not along the radius) so the
                                // amount reads normally when it reaches the pointer.
                                transform="translate(0 -76)"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={prize.label.length > 6 ? 8 : 11}
                                letterSpacing="-0.3"
                                {...(prize.label.length > 6 && prize.label.length * 4.6 > labelRoom
                                    ? { textLength: labelRoom, lengthAdjust: 'spacingAndGlyphs' }
                                    : {})}
                                fontWeight="900"
                                fontFamily="Poppins, Inter, sans-serif"
                                fill={color === '#FFFFFF' ? 'var(--c-page)' : '#FFFFFF'}
                                stroke={color === '#FFFFFF' ? 'none' : 'rgba(0,0,0,0.25)'}
                                strokeWidth="0.6"
                            >
                                {prize.label}
                            </text>
                        </g>
                    </g>
                )
            })}
            {prizes.map((_, index) => (
                <line key={index} x1="0" y1="0" x2="0" y2="-100" transform={`rotate(${index * SEGMENT - SEGMENT / 2})`} stroke="#F5D06F" strokeWidth="1.3" />
            ))}
            <circle r="99" fill="none" stroke="#F5D06F" strokeWidth="2" />
            <defs>
                <radialGradient id="spin-shade" r="0.5" cx="0.5" cy="0.5">
                    <stop offset="0.2" stopColor="#000" stopOpacity="0.18" />
                    <stop offset="0.75" stopColor="#000" stopOpacity="0" />
                    <stop offset="1" stopColor="#000" stopOpacity="0.12" />
                </radialGradient>
            </defs>
        </svg>
    )
}

function WheelRim({ spinning }) {
    const bulbs = Array.from({ length: 18 }, (_, index) => {
        const rad = (index * 20 * Math.PI) / 180
        return { x: Math.sin(rad) * 140, y: -Math.cos(rad) * 140, even: index % 2 === 0 }
    })
    return (
        <svg viewBox="-150 -150 300 300" className="absolute inset-0 size-full" aria-hidden="true">
            <defs>
                <linearGradient id="spin-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFF2B0" />
                    <stop offset="0.45" stopColor="#FFCB07" />
                    <stop offset="1" stopColor="#9A6B00" />
                </linearGradient>
                <linearGradient id="spin-rim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--c-line-strong)" />
                    <stop offset="1" stopColor="var(--c-page)" />
                </linearGradient>
            </defs>
            <circle r="149" fill="url(#spin-gold)" />
            <circle r="146" fill="url(#spin-rim)" />
            <circle r="131" fill="var(--c-page)" />
            {bulbs.map((bulb, index) => (
                <circle key={index} cx={bulb.x} cy={bulb.y} r="5" className={`spin-bulb ${bulb.even ? '' : 'spin-bulb-alt'} ${spinning ? 'spin-bulb-fast' : ''}`} />
            ))}
        </svg>
    )
}

function WheelStand() {
    return (
        <svg viewBox="0 0 200 80" className="mx-auto -mt-[7%] block w-[48%]" aria-hidden="true">
            <defs>
                <linearGradient id="spin-stand" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="var(--c-surface)" />
                    <stop offset="0.5" stopColor="var(--c-line-strong)" />
                    <stop offset="1" stopColor="var(--c-surface)" />
                </linearGradient>
            </defs>
            <path d="M66 0 H134 L160 64 H40 Z" fill="url(#spin-stand)" stroke="#B88700" strokeWidth="1.5" />
            <rect x="18" y="63" width="164" height="14" rx="4" fill="url(#spin-gold)" />
        </svg>
    )
}

// Development only (`npm run dev`): sample rows so the empty Winner's List can
// be designed and checked. Labelled DEMO, and never part of a production build,
// where only real winners from /api/bonus-spin/board are shown.
const SHOW_DEMO_WINNERS = import.meta.env.DEV
const DEMO_NAMES = ['rabban', 'kasem1', 'jptwam', 'rakib77', 'sumon', 'shuvo', 'nayeem', 'arif99', 'tanvir', 'mamun', 'sabbir', 'hridoy']
const DEMO_ROWS = 16

function demoWinner(prizes) {
    const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]
    const prize = prizes[Math.floor(Math.random() * prizes.length)]
    return {
        id: Math.random().toString(36).slice(2),
        date: new Date().toISOString().slice(0, 10),
        user: `${`${name}${Math.floor(Math.random() * 100)}`.slice(0, 6)}***`,
        prize: { label: prize.label },
    }
}

function DemoWinners({ prizes }) {
    const [rows, setRows] = useState(() => Array.from({ length: DEMO_ROWS }, () => demoWinner(prizes)))
    // A new demo row on top every few seconds, so the scrolling list can be checked.
    useEffect(() => {
        const timer = setInterval(() => setRows((list) => [demoWinner(prizes), ...list].slice(0, DEMO_ROWS)), 7000)
        return () => clearInterval(timer)
    }, [prizes])
    return (
        <div className="relative">
            <span className="absolute right-3 top-1 z-10 rounded bg-[#F2545B] px-2 py-0.5 text-[10px] font-bold uppercase text-white">Demo</span>
            <WinnersList winners={rows} />
        </div>
    )
}

function WinnersList({ winners }) {
    const rows = [...winners, ...winners]
    return (
        <div className="relative h-[280px] overflow-hidden">
            <ul className="spin-winners-scroll" style={{ animationDuration: `${winners.length * 1.6}s` }}>
                {rows.map((row, index) => (
                    <li key={`${row.id}-${index}`} className="grid h-10 grid-cols-[1fr_1fr_1fr] items-center px-3 text-[13px]">
                        <span className="text-white/70">{row.date}</span>
                        <span className="text-white/90">{row.user}</span>
                        <span className="text-right font-medium text-primary">{row.prize.label}</span>
                    </li>
                ))}
            </ul>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-page to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-page to-transparent" />
        </div>
    )
}

function SpinPanel({ onClose, onCount }) {
    const navigate = useNavigate()
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const [status, setStatus] = useState(null)
    const [board, setBoard] = useState({ winners: [] })
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [rotation, setRotation] = useState(0)
    const [spinning, setSpinning] = useState(false)
    const [result, setResult] = useState(null)
    const [tab, setTab] = useState('all')

    const apply = useCallback(({ loss, board: boardData, failure }) => {
        setStatus(loss)
        setBoard(boardData)
        if (failure) setMessage(failure)
        setLoading(false)
        onCount?.(spinsLeft({ loss }))
    }, [onCount])
    const load = useCallback(() => fetchSpinData(isLoggedIn).then(apply), [isLoggedIn, apply])

    useEffect(() => {
        let live = true
        fetchSpinData(isLoggedIn).then((data) => { if (live) apply(data) })
        return () => { live = false }
    }, [isLoggedIn, apply])

    useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape' && !spinning) onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose, spinning])

    const tickets = Number(status?.remaining_spins || 0)
    const prizes = useMemo(() => buildPrizes(status?.wheel), [status])
    const segment = 360 / prizes.length
    const enabled = !isLoggedIn || status?.enabled !== false
    const myWins = status?.recent_wins || []
    const winLabel = (row) => amountText(row.amount)
    const lastWin = myWins[0]
    const totalWon = myWins.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    const prizeChips = useMemo(
        () => prizes.map((prize, index) => ({ ...prize, color: segmentColor(index) })).sort((a, b) => a.value - b.value),
        [prizes],
    )
    const bands = status?.rules?.bands || []
    const winners = (board.winners || []).map((row, index) => ({
        id: `${row.date}-${row.username}-${index}`,
        date: row.date,
        user: row.username,
        prize: { label: row.type === 'cash' ? amountText(row.amount) : row.prize },
    }))
    const window24h = status?.current_window
    const minimumLoss = Number(window24h?.minimum_loss ?? status?.rules?.minimum_loss ?? 0)

    const spin = async () => {
        if (spinning) return
        if (!isLoggedIn) {
            onClose()
            navigate('/login', { state: { returnTo: window.location.pathname + window.location.search } })
            return
        }
        if (tickets < 1 || !enabled) return
        setMessage('')
        setSpinning(true)
        let payout
        try {
            payout = (await api.post('/api/bonus-spin/loss-spins/play', {})).data
        } catch (error) {
            setSpinning(false)
            setMessage(error.message || 'Spin could not be completed')
            load()
            return
        }
        // The server names the slice it paid; otherwise land on the nearest one.
        const serverIndex = Number(payout.wheel_index)
        const index = serverIndex >= 0 && serverIndex < prizes.length && prizes[serverIndex].value === Number(payout.amount)
            ? serverIndex
            : nearestPrize(prizes, Number(payout.amount))
        const jitter = (Math.random() - 0.5) * segment * 0.7
        const target = (360 - index * segment + jitter + 360) % 360
        setRotation((current) => current + 360 * 6 + ((target - (current % 360) + 360) % 360))
        const remaining = Number(payout.remaining_spins || 0)
        setStatus((current) => (current ? { ...current, remaining_spins: remaining } : current))
        onCount?.(remaining)
        setTimeout(() => {
            setSpinning(false)
            setResult({ amount: Number(payout.amount), label: amountText(payout.amount), remaining })
            requestAccountRefresh()
            load()
        }, SPIN_MS)
    }

    // What the bar under the wheel says when there is no new win to show.
    const idleText = loading
        ? 'Loading...'
        : !isLoggedIn
            ? 'Login to spin'
            : !enabled
                ? 'Spin unavailable'
                : tickets > 0
                    ? 'Tap SPIN to play!'
                    : window24h
                        ? `Loss ${amountText(window24h.loss)} / ${amountText(minimumLoss)}`
                        : 'No spin yet'
    // Small line under the bar: how a spin is earned, while there is none to play.
    const idleHint = !loading && isLoggedIn && enabled && tickets < 1
        ? window24h
            ? `Reach ${amountText(minimumLoss)} loss within 24h to unlock a spin`
            : 'Spins come from your loss after your first deposit of the day'
        : ''

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Spin and win"
            className="fixed inset-0 z-[21480] flex justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            {/* Grows out of the floating mini wheel (bottom-right of the app). */}
            <motion.div
                className="relative h-dvh w-full max-w-[430px] overflow-y-auto bg-[radial-gradient(circle_at_50%_18%,#3B2F00_0%,#1C1C1C_45%,#101010_100%)] font-inter text-white will-change-transform"
                style={{ originX: 0.88, originY: 0.72 }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="sticky top-0 z-10 flex items-center justify-between bg-page px-4 py-3">
                    <span className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/40 px-3 py-1 text-[12px] font-semibold text-primary"><Ticket className="size-4" />{tickets} {tickets === 1 ? 'Spin' : 'Spins'}</span>
                    <span className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-black/40 px-3 py-1 text-[12px] font-semibold text-primary"><Wallet className="size-4" />Won {amountText(totalWon)}</span>
                    <button type="button" onClick={onClose} disabled={spinning} aria-label="Close spin and win" className="grid size-8 place-items-center rounded-full bg-primary text-black disabled:opacity-50"><X className="size-5" strokeWidth={3} /></button>
                </div>

                <h2 className="spin-title mt-2 text-center font-poppins text-[34px] font-black italic tracking-wide">SPIN &amp; WIN</h2>

                <div className="relative z-1 mx-auto mt-5 aspect-square w-[min(86vw,340px)]">
                    <div className="absolute inset-[-6%] rounded-full bg-primary/20 blur-2xl" />
                    <WheelRim spinning={spinning} />
                    <div
                        className="absolute inset-[12.6%] rounded-full"
                        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.12, 1)` : 'none' }}
                    >
                        <WheelFace prizes={prizes} />
                    </div>
                    <svg viewBox="0 0 30 50" className="absolute left-1/2 top-[1%] z-10 w-[8%] -translate-x-1/2 drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)]" aria-hidden="true">
                        <path d="M2 2 H28 V26 L15 48 L2 26 Z" fill="url(#spin-gold)" stroke="#7A5A00" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9 6 V26 L15 38" fill="none" stroke="#FFF6C2" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <button
                        type="button"
                        onClick={spin}
                        disabled={spinning || loading || (isLoggedIn && (tickets < 1 || !enabled))}
                        className="absolute left-1/2 top-1/2 z-10 grid size-[21%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-[#B88700] bg-[radial-gradient(circle_at_35%_30%,#FFF2B0,#FFCB07_50%,#9A6B00)] font-poppins text-[14px] font-black text-[#3A2A00] shadow-[0_0_0_4px_#F5D06F,0_4px_14px_rgba(0,0,0,0.6)] enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed"
                    >
                        {spinning ? '...' : 'SPIN'}
                    </button>
                </div>
                <WheelStand />

                {/* Grows with its text (never spills out of the pill); one short line in practice. */}
                <div className="mx-auto mt-5 flex min-h-11 w-[78%] items-center justify-center gap-2 rounded-full border-2 border-primary bg-gradient-to-b from-[#FFE680] to-[#FFCB07] px-4 py-1.5 text-center font-poppins text-[16px] font-bold leading-tight text-on-gold shadow-[0_4px_16px_rgba(255,203,7,0.35)]">
                    {lastWin && !(tickets > 0) && !idleHint
                        ? <><Coins className="size-5 shrink-0" />{winLabel(lastWin)}</>
                        : idleText}
                </div>
                {idleHint && <p className="mx-6 mt-2 text-center text-[12px] text-white/70">{idleHint}</p>}
                {message && <p role="alert" className="mx-6 mt-3 text-center text-[13px] font-medium text-[#F2545B]">{message}</p>}

                <section className="mx-4 mt-6">
                    <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-white"><Gift className="size-4 text-primary" />Prizes</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {prizeChips.map((prize) => (
                            <div key={prize.label} className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2 text-[13px] font-semibold">
                                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: prize.color }} />
                                <span className="truncate">{prize.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-4 mt-8 rounded-2xl border-2 border-primary bg-page pb-2">
                    <div className="mx-auto -mt-4 flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-[#FFE680] to-[#FFCB07] px-6 py-1.5 font-poppins text-[15px] font-extrabold uppercase text-on-gold">
                        <Trophy className="size-4" />Winners
                    </div>
                    <div className="mx-3 mt-3 grid grid-cols-2 rounded-full bg-surface p-1 text-[13px] font-semibold">
                        {[['all', "Winner's List"], ['mine', 'My Winning']].map(([value, label]) => (
                            <button key={value} type="button" onClick={() => setTab(value)} className={`h-8 rounded-full ${tab === value ? 'bg-primary text-black' : 'text-white/80'}`}>{label}</button>
                        ))}
                    </div>
                    <div className="mt-2">
                        {tab === 'all'
                            ? winners.length
                                ? <WinnersList winners={winners} />
                                : SHOW_DEMO_WINNERS
                                    ? <DemoWinners prizes={prizes} />
                                    : <p className="flex h-[280px] items-center justify-center text-[13px] text-white/60">No winners yet. Be the first!</p>
                            : !isLoggedIn
                                ? <p className="flex h-[280px] items-center justify-center text-[13px] text-white/60">Login to see your winnings.</p>
                            : myWins.length
                                ? (
                                    <ul className="max-h-[280px] overflow-y-auto">
                                        {myWins.map((row) => (
                                            <li key={row.id} className="grid h-10 grid-cols-[1fr_1fr_1fr] items-center px-3 text-[13px]">
                                                <span className="text-white/70">{dateOnly(row.created_at)}</span>
                                                <span className="text-white/90">You</span>
                                                <span className="truncate text-right font-medium text-primary">{winLabel(row)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )
                                : <p className="flex h-[280px] items-center justify-center text-[13px] text-white/60">No winnings yet. Spin the wheel!</p>}
                    </div>
                </section>

                <section className="mx-4 mb-10 mt-6 rounded-md border border-line bg-surface p-4 text-[13px] leading-relaxed text-white/85">
                    <h3 className="mb-1 text-[15px] font-semibold text-white">🎡 স্পিনের নিয়মাবলি (Spin Rules)</h3>
                    <p className="text-white/70">chorkix.com-এর পক্ষ থেকে আপনাকে স্বাগতম! আকর্ষণীয় chorkix.com স্পিন রিওয়ার্ড জিতে নিতে নিচের সহজ শর্তগুলো অনুসরণ করুন:</p>
                    <div className="my-4 border-t border-dashed border-white/20" />
                    <ol className="space-y-3">
                        {/* Built from Spin Management (loss bands, validity) as the server sends it. */}
                        <li><span className="font-semibold text-primary">১. দৈনিক স্পিন:</span> প্রতিদিন সর্বোচ্চ ১টি স্পিন। স্পিন শুধু লস থেকেই আসে: লস না হলে কোনো স্পিন পাওয়া যাবে না।</li>
                        <li><span className="font-semibold text-primary">২. সর্বনিম্ন লস:</span> স্পিন পেতে ২৪ ঘণ্টার মধ্যে কমপক্ষে {minimumLoss > 0 ? amountText(minimumLoss) : '—'} লস হতে হবে।</li>
                        <li><span className="font-semibold text-primary">৩. সময়সীমা:</span> দিনের প্রথম ডিপোজিট করার সময় থেকে পরবর্তী ২৪ ঘণ্টা পর্যন্ত লস গণনা করা হবে।</li>
                        <li><span className="font-semibold text-primary">৪. অটোমেটিক টোকেন:</span> লস সর্বনিম্ন সীমায় পৌঁছালেই স্পিনটি স্বয়ংক্রিয়ভাবে (অটোমেটিক) চালু হয়ে যাবে। স্পিন করার আগে আরও লস হলে পুরস্কারের সীমা বড় হবে।</li>
                        {bands.length > 0 && (
                            <li>
                                <span className="font-semibold text-primary">৫. পুরস্কার:</span> চাকার {amountText(prizes.reduce((min, p) => Math.min(min, p.value), Infinity))} – {amountText(prizes.reduce((max, p) => Math.max(max, p.value), 0))} এর ঘর থেকে, আপনার লস অনুযায়ী:
                                <ul className="mt-2 space-y-1 pl-4">
                                    {bands.map((band) => (
                                        <li key={band.min_loss} className="list-disc">
                                            লস {amountText(band.min_loss)}+ → {amountText(band.reward_min)} – {amountText(band.reward_max)}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        )}
                        {Number(status?.rules?.validity_days) > 0 && (
                            <li><span className="font-semibold text-primary">{bands.length > 0 ? '৬' : '৫'}. মেয়াদ:</span> ২৪ ঘণ্টার সময়সীমা শেষ হওয়ার পর {status.rules.validity_days} দিনের মধ্যে স্পিনটি ব্যবহার করতে হবে, নইলে টোকেনটি বাতিল হয়ে যাবে।</li>
                        )}
                    </ol>
                    <p className="mt-4 text-center text-white/70">chorkix.com-এর সঙ্গেই থাকুন এবং উপভোগ করুন রোমাঞ্চকর সব রিওয়ার্ড! ❤️</p>
                </section>
            </motion.div>

            {result && (
                <div className="fixed inset-0 z-[21490] flex items-center justify-center bg-black/75 p-6" onClick={() => setResult(null)}>
                    <div className="spin-result-pop w-full max-w-[320px] rounded-3xl border-2 border-primary bg-[radial-gradient(circle_at_50%_0%,#4A3A00,#1C1C1C_70%)] p-6 text-center shadow-[0_0_40px_rgba(255,203,7,0.45)]" onClick={(event) => event.stopPropagation()}>
                        <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-b from-[#FFE680] to-[#FFCB07] text-on-gold shadow-[0_0_24px_rgba(255,203,7,0.7)]">
                            <Coins className="size-10" strokeWidth={2.2} />
                        </div>
                        <p className="spin-title mt-4 font-poppins text-[24px] font-black italic">Congratulations!</p>
                        <p className="mt-1 text-[14px] text-white/80">You won</p>
                        <p className="mt-1 font-poppins text-[30px] font-extrabold text-primary">{result.label}</p>
                        <p className="mt-1 text-[14px] font-semibold text-white/90">Added to your main wallet</p>
                        <button type="button" onClick={() => setResult(null)} className="mt-5 h-11 w-full rounded-full bg-primary font-semibold text-black hover:brightness-110">
                            {result.remaining > 0 ? 'Spin Again' : 'OK'}
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// How often the launcher badge rechecks spins while the site is on screen.
const COUNT_REFRESH_MS = 2 * 60_000

// The spin panel, opened from the floating launcher in support.jsx. Also keeps
// the launcher's badge showing how many spins are waiting.
export default function SpinWheel({ onCountChange }) {
    const [open, setOpen] = useState(false)
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const report = useCallback((count) => onCountChange?.(count), [onCountChange])

    // The floating launcher in support.jsx opens the wheel.
    useEffect(() => {
        const show = () => setOpen(true)
        window.addEventListener('velki:open-spin', show)
        return () => window.removeEventListener('velki:open-spin', show)
    }, [])

    useEffect(() => {
        if (!isLoggedIn) {
            report(0)
            return undefined
        }
        let live = true
        let lastCheck = 0
        const refresh = () => {
            if (document.visibilityState !== 'visible') return
            lastCheck = Date.now()
            fetchMySpins().then((mine) => { if (live) report(spinsLeft(mine)) })
        }
        // Coming back to the tab: recheck unless it was checked a moment ago.
        const onVisible = () => { if (Date.now() - lastCheck > 30_000) refresh() }
        refresh()
        const interval = window.setInterval(refresh, COUNT_REFRESH_MS)
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener(ACCOUNT_REFRESH_EVENT, refresh)
        return () => {
            live = false
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener(ACCOUNT_REFRESH_EVENT, refresh)
        }
    }, [isLoggedIn, report])

    return <>
        {createPortal(<AnimatePresence>{open && <SpinPanel key="spin-panel" onClose={() => setOpen(false)} onCount={report} />}</AnimatePresence>, document.body)}
    </>
}
