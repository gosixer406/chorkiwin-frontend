import Loader from '@/components/loader'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    ChevronDown,
    ChevronRight,
    Clock3,
    Coins,
    FileChartColumn,
    Grid2X2,
    History,
    List,
    Menu,
    MessageSquareText,
    Search,
    Send,
    Star,
    X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { setUser } from '@/lib/auth'
import { fetchFreshAccount } from '@/lib/refresh-account'
import { normalizeGame } from '@/lib/games'
import useHotGames from '@/hooks/use-hot-games'
import GameImage from '@/components/game-image'
import { readFavorites, toggleFavorite } from '@/lib/favorites'
import { validatedGameLaunchUrl } from '@/lib/game-launch-url'
import { cancelCasinoGameTab, reserveCasinoGameTab, showCasinoGame } from '@/lib/casino-game-tab'
import useMobileGameImmersion from '@/hooks/use-mobile-game-immersion'
import fallbackGame from '@/assets/img/game-img.png'
import velkiLogo from '@/assets/img/logo/short_logo_3d.png'

const AWC = 'https://fsagh.velkigames365.cc'
const RECENT_KEY = 'velki_recent_games'

const PROVIDERS = [
    ['SEXYBCRT', 'SEXY CASINO', 'SEXY', 'play'],
    ['PG', 'PG', 'PG'],
    ['JILI', 'JILI', 'JL'],
    ['PP', 'PP', 'PP', 'maintenance'],
    ['SV388', 'SV388', 'SV388', 'play'],
    ['FC', 'FC', 'FACHAI'],
    ['SPADE', 'SPADE', 'SG'],
    ['BG', 'BG', 'BG', 'play'],
    ['NLC', 'NLC', 'NLCASIA'],
    ['FASTSPIN', 'FASTSPIN', 'FASTSPIN'],
    ['E1SPORT', 'E1SPORT', 'E1SPORT', 'play'],
    ['SABA', 'SABA', 'SABA', 'play'],
    ['HORSEBOOK', 'HORSEBOOK', 'HORSEBOOK', 'play'],
    ['DRAGOONSOFT', 'DRAGOONSOFT', 'DRAGOONSOFT'],
    ['PLAY8', 'PLAY8', 'ONLYPLAY'],
    ['KINGMAKER', 'KINGMIDAS', 'KM'],
    ['RT', 'RT', 'RTASIA'],
    ['JDB', 'JDB', 'JDB'],
    ['BTG', 'BTG', 'BTGASIA'],
    ['CG', 'Creative Gaming', 'CG'],
    ['CRASH88', 'CRASH88', 'GALAXSYS'],
    ['EVOLUTION', 'EVOLUTION', 'EVOASIA'],
    ['HOTROAD', 'HOTROAD', 'HOTROAD'],
    ['JOKER', 'JOKER', 'JOKER', 'maintenance'],
    ['LADYLUCK', 'LADYLUCK', 'LADYLUCK'],
    ['NETENT', 'NETENT', 'NETENTASIA'],
    ['OCTOPLAY', 'OCTOPLAY', 'OCTOPLAY'],
    ['PINNACLE', 'SPORTS38', 'PINNACLE', 'maintenance'],
    ['PT', 'PT', 'PTASIA'],
    ['SMARTSOFT', 'SMARTSOFT', 'SMARTSOFT'],
    ['SPRIBE', 'SPRIBE', 'SPRIBE'],
    ['VIACASINO', 'VIACASINO', 'VIACASINO'],
    ['WINFINITY', 'WINFINITY', 'WINFINITY'],
    ['YESBINGO', 'YELLOWBAT', 'YGR'],
    ['YL', 'YL', 'YL'],
].map(([assetCode, name, localCode, state = 'more']) => ({ assetCode, name, localCode, state }))

const PROVIDER_BY_ASSET = Object.fromEntries(PROVIDERS.map((provider) => [provider.assetCode, provider]))

const CATEGORY_DATA = [
    { id: 'hot', label: 'Hot', bg: 'bg-new-Dlfy301l.jpg', icon: '♨', providers: [] },
    { id: 'live', label: 'Live', bg: 'bg-live-BIJ80V7H.jpg', modal: 'live-modal-BsWmqc1h.webp', icon: '♠', providers: ['VIACASINO', 'BG', 'WINFINITY', 'HORSEBOOK', 'EVOLUTION', 'HOTROAD', 'PT', 'PP', 'SEXYBCRT', 'SV388'] },
    { id: 'fh', label: 'Fishing', bg: 'bg-fh-un_9Ad-X.jpg', modal: 'fh-modal-BniKefoA.webp', icon: '◉', providers: ['YL', 'JILI', 'FASTSPIN', 'SPADE', 'FC', 'JDB', 'YESBINGO'] },
    { id: 'slot', label: 'Slot', bg: 'bg-slot-7gLQ44uu.jpg', icon: '♜', providers: ['OCTOPLAY', 'NLC', 'PT', 'FC', 'RT', 'JOKER', 'YESBINGO', 'BTG', 'KINGMAKER', 'DRAGOONSOFT', 'PG', 'JDB', 'CG', 'PP', 'NETENT', 'PLAY8', 'JILI', 'SPADE', 'LADYLUCK'] },
    { id: 'table', label: 'Table', bg: 'bg-table-U3l1yJe4.jpg', icon: '♣', providers: ['NETENT', 'RT', 'KINGMAKER', 'JILI', 'JDB', 'PG'] },
    { id: 'egame', label: 'Egame', bg: 'bg-egame-CtGbKclz.jpg', icon: '⌘', providers: ['SMARTSOFT', 'SPRIBE', 'FC', 'YL', 'JDB', 'PP', 'SPADE', 'CRASH88'] },
    { id: 'bingo', label: 'Bingo', bg: 'bg-bingo-CgwkkYJ1.jpg', icon: '▦', providers: ['YESBINGO'] },
    { id: 'esports', label: 'Esports', bg: 'bg-esports-Crk8f_pc.jpg', icon: '♟', providers: ['E1SPORT'] },
    { id: 'sports', label: 'Sports', bg: 'bg-sports-B-Iy1ZC0.jpg', icon: '⚽', providers: ['SABA', 'PINNACLE'] },
]

const NAV_ITEMS = [['recent', 'Recent'], ['favorite', 'Favorite'], ['rankings', 'Rankings'], ['games', 'Games'], ['platform', 'Platform']]

function readStored(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(value) ? value : []
    } catch {
        return []
    }
}

function mergeGames(current, incoming) {
    const rows = new Map(current.map((game) => [game.uid, game]))
    incoming.forEach((game) => rows.set(game.uid, game))
    return [...rows.values()]
}

function mergeProviders(current, incoming) {
    const rows = new Map(current.map((provider) => [provider.code, provider]))
    incoming.forEach((provider) => rows.set(provider.code, provider))
    return [...rows.values()]
}

function saveRecentGame(game) {
    const rows = [game, ...readStored(RECENT_KEY).filter((item) => item.uid !== game.uid)].slice(0, 60)
    localStorage.setItem(RECENT_KEY, JSON.stringify(rows))
    return rows
}

function providerAsset(provider, kind = 'logo') {
    if (kind === 'cover') return `${AWC}/image/platform/${provider.assetCode}/${provider.assetCode}_cover.png`
    if (kind === 'tile') return `${AWC}/image/gameIcon/${provider.assetCode}/${provider.assetCode}.png`
    return `${AWC}/image/platform/${provider.assetCode}/${provider.assetCode}.png`
}

function HallIcon({ name, className = 'size-7' }) {
    if (name === 'rankings') {
        return <svg viewBox="0 0 100 100" className={className} fill="currentColor"><path d="m51.71 52.697 6.916 3.996v25.353H65.5v-8.812a3.97 3.97 0 0 1 3.97-3.97h7.69a3.97 3.97 0 0 1 3.97 3.97v8.997H88v7.57H12v-7.57h8.625V66.037a3.97 3.97 0 0 1 3.97-3.97h7.56a3.97 3.97 0 0 1 3.97 3.97v16.194h7.02V57.657zM52.067 11l6.892 15.519 17.29 1.586-13.031 11.177 3.794 16.5-14.945-8.612-14.945 8.612 3.792-16.5-13.029-11.177 17.29-1.586z" /></svg>
    }
    if (name === 'games') return <svg viewBox="0 0 100 100" className={className} fill="currentColor"><path d="M43.439 88V46.874H88V88zm0-76H88v28.626H43.439zM12 61.812h25.127V88H12zM12 12h25.127v44.188H12z" /></svg>
    if (name === 'platform') return <svg viewBox="0 0 255 255" className={className} fill="currentColor"><path d="M84.6 42.1H20.3a7.2 7.2 0 0 0-7.2 7.2v64.4a7.2 7.2 0 0 0 7.2 7.2h64.4a7.2 7.2 0 0 0 7.2-7.2V49.3a7.2 7.2 0 0 0-7.3-7.2m32.2 32.2h118a7.2 7.2 0 1 0 0-14.4h-118a7.2 7.2 0 1 0 0 14.4m0 32.2h78.7a7.2 7.2 0 1 0 0-14.4h-78.7a7.2 7.2 0 1 0 0 14.4M84.6 145.8H20.3a7.2 7.2 0 0 0-7.2 7.2v64.4a7.2 7.2 0 0 0 7.2 7.2h64.4a7.2 7.2 0 0 0 7.2-7.2V153a7.2 7.2 0 0 0-7.3-7.2m150.2 17.9h-118a7.2 7.2 0 1 0 0 14.4h118a7.2 7.2 0 1 0 0-14.4m-39.3 32.2h-78.7a7.2 7.2 0 1 0 0 14.4h78.7a7.2 7.2 0 1 0 0-14.4" /></svg>
    if (name === 'favorite') return <Star className={className} fill="currentColor" />
    return <History className={className} />
}

function HallHeader({ user, onMenu, query, onQuery, showSearch }) {
    const identity = user?.username || user?.email?.split('@')[0] || 'CHORKIX.COM PLAYER'
    return <>
        <header className="flex shrink-0 items-center border-b border-line bg-surface px-2 text-white" style={{ height: 60 }}>
            <img src={`${AWC}/assets/logo-AWC-CUc0ZF3S.webp`} alt="AWC" className="object-contain" style={{ width: 80, height: 37 }} />
            <div className="min-w-0 flex-1 pl-6 text-[12px] leading-5"><div className="truncate text-white"><span className="mr-1 text-gold">♟</span>{identity}</div><div className="text-ink-muted"><span className="mr-1 text-gold">♟</span>************</div></div>
            <button type="button" aria-label="Wallet information" className="grid size-8 place-items-center text-gold"><Coins className="size-6" /></button>
            <button type="button" onClick={onMenu} aria-label="Open game hall menu" className="ml-1 grid size-10 place-items-center text-white"><Menu className="size-7 stroke-[2.5]" /></button>
        </header>
        {showSearch && <div className="flex shrink-0 items-center border-b border-line bg-page px-2" style={{ height: 54 }}><label className="flex h-10 w-full items-center rounded-full border border-line bg-surface px-3 text-ink-muted focus-within:border-gold"><Search className="mr-2 size-5 shrink-0 stroke-[3]" /><span className="sr-only">Search game</span><input value={query} onChange={(event) => onQuery(event.target.value)} type="search" placeholder="Search game" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ink-muted" /></label></div>}
    </>
}

function BottomNavigation({ active, onChange }) {
    return <nav className="absolute inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] text-ink-muted" style={{ height: 65 }}>{NAV_ITEMS.map(([id, label]) => {
        const selected = id === active
        return <button key={id} type="button" onClick={() => onChange(id)} className={`relative flex flex-1 flex-col items-center justify-end pb-0.5 text-[12px] ${selected ? 'text-gold' : ''}`}><span className={`mb-0.5 grid size-9 place-items-center rounded-full ${selected ? 'bg-gold text-on-gold shadow-[0_0_0_2px_var(--c-surface),0_0_0_3px_var(--c-gold)]' : ''}`}><HallIcon name={id} className="size-6" /></span><span>{label}</span></button>
    })}</nav>
}

function EmptyState({ kind }) {
    const favorite = kind === 'favorite'
    return <section className="min-h-full bg-page px-3 pt-4 text-white"><h2 className="flex items-center gap-2 py-1 text-base font-bold text-white"><HallIcon name={favorite ? 'favorite' : 'recent'} className="size-6" />{favorite ? 'Favorite' : 'Recent'}</h2><div className="flex flex-col items-center pt-24 text-center"><img src={`${AWC}/assets/${favorite ? 'img-favorite-nodata-Bn8kIqlJ.png' : 'img-recent-nodata-ChlKvbXt.png'}`} alt="" className={favorite ? 'h-auto w-52' : 'h-auto w-40'} /><p className="mt-8 max-w-[290px] text-lg font-bold leading-6 text-ink-soft">{favorite ? 'Add more games to your favorite collection!' : 'Begin your journey by playing some games!'}</p></div></section>
}

function MaintenanceOverlay({ compact = false }) {
    return <div className="absolute z-10 flex items-center justify-center rounded-lg border border-line bg-black/80 text-ink-soft" style={{ inset: compact ? 4 : 6 }}><span className="mr-3 text-4xl">⚙</span><span className="text-xs leading-4">Under<br />Maintenance</span></div>
}

function PlatformCard({ provider, grid, onSelect }) {
    const [failed, setFailed] = useState(false)
    if (grid) return <button type="button" onClick={() => onSelect(provider)} className="relative overflow-hidden rounded-md border border-line bg-surface text-white transition-colors hover:border-gold/60" style={{ height: 181 }}>{!failed && <img src={providerAsset(provider, 'cover')} onError={() => setFailed(true)} alt="" className="absolute object-cover" style={{ inset: 2, height: 137, width: 'calc(100% - 4px)' }} />}{provider.state === 'maintenance' && <MaintenanceOverlay compact />}<span className="absolute inset-x-0 bottom-2.5 truncate px-2 text-center text-[12px] font-semibold">{provider.name}</span></button>
    return <article className="relative flex items-center overflow-hidden rounded-md border border-line bg-surface px-3 text-white" style={{ height: 88 }}><div className="grid shrink-0 place-items-center rounded-full border border-line bg-page" style={{ width: 68, height: 68, flex: '0 0 68px' }}>{!failed ? <img src={providerAsset(provider)} onError={() => setFailed(true)} alt="" className="rounded-full object-contain" style={{ width: 60, height: 60 }} /> : <strong className="text-gold">{provider.name.slice(0, 3)}</strong>}</div><strong className="ml-4 min-w-0 flex-1 truncate text-sm">{provider.name}</strong><button type="button" onClick={() => onSelect(provider)} aria-label={`${provider.state === 'play' ? 'Play' : 'View'} ${provider.name}`} className={`h-7 shrink-0 rounded-full px-3.5 text-[11px] font-semibold uppercase ${provider.state === 'play' ? 'bg-gold text-on-gold' : 'border border-gold text-gold'}`}>{provider.state === 'play' ? 'Play Now' : 'More'}</button>{provider.state === 'maintenance' && <MaintenanceOverlay />}</article>
}

function PlatformPage({ query, grid, providers, onGrid, onSelect }) {
    const filtered = providers.filter((provider) => `${provider.name} ${provider.assetCode}`.toLowerCase().includes(query.toLowerCase()))
    return <section className="min-h-full bg-page pb-20"><div className="sticky top-0 z-20 flex items-center border-b border-line bg-page px-3 text-white" style={{ height: 56 }}><span className="mr-2 h-[13px] w-1 rounded-full bg-gold" /><strong className="mr-3 text-[14px]">Platform List</strong><button type="button" onClick={() => onGrid(false)} aria-label="List view" className={`grid size-9 place-items-center ${!grid ? 'border-b-2 border-gold text-gold' : 'text-ink-muted'}`}><List className="size-5" /></button><button type="button" onClick={() => onGrid(true)} aria-label="Grid view" className={`grid size-9 place-items-center ${grid ? 'border-b-2 border-gold text-gold' : 'text-ink-muted'}`}><Grid2X2 className="size-5" /></button><label className="ml-auto flex h-9 w-[128px] items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-ink-muted"><Search className="size-4 shrink-0" /><span className="sr-only">Search providers</span><input value={query} readOnly placeholder="Search" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-ink-muted" /></label></div><div className={grid ? 'grid grid-cols-2 gap-2.5 px-2.5 pt-3' : 'space-y-2.5 px-2.5 pt-3'}>{filtered.map((provider) => <PlatformCard key={provider.assetCode} provider={provider} grid={grid} onSelect={onSelect} />)}</div></section>
}

function ProviderTile({ provider, onSelect }) {
    const [failed, setFailed] = useState(false)
    return <button type="button" onClick={() => onSelect(provider)} className="relative min-w-0 p-1 text-white" style={{ height: 177 }}><div className="relative mb-3 w-full bg-contain bg-center bg-no-repeat" style={{ height: 122, backgroundImage: `url(${AWC}/assets/img-silver-Bl8yRsWY.webp)` }}><span className="absolute left-2 right-2 top-[-16px] h-4 truncate rounded-t bg-surface px-1 text-center text-[9px] leading-4 text-white">{provider.name}</span>{!failed ? <img src={providerAsset(provider, 'tile')} onError={() => setFailed(true)} alt="" className="absolute inset-2 object-contain" style={{ width: 'calc(100% - 16px)', height: 'calc(100% - 16px)' }} /> : <span className="absolute inset-2 grid place-items-center bg-surface text-xl font-black text-gold">{provider.name.slice(0, 3)}</span>}<Star className="absolute -bottom-2 -right-1 size-9 fill-page stroke-gold stroke-[2]" />{provider.state === 'maintenance' && <MaintenanceOverlay compact />}</div><strong className="block truncate text-[12px]">{provider.name}</strong></button>
}

function CategoryMenu({ current, onPick, onClose }) {
    return <div className="absolute inset-x-0 top-0 z-30" style={{ height: 254, backgroundColor: 'color-mix(in srgb,var(--c-page) 94%,transparent)', backdropFilter: 'blur(3px)' }}><button type="button" onClick={onClose} aria-label="Close categories" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-surface text-white"><X className="size-5" /></button><div className="grid gap-y-1 px-2 pt-14" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>{CATEGORY_DATA.map((category) => <button key={category.id} type="button" onClick={() => onPick(category.id)} className={`flex flex-col items-center justify-center text-[10px] ${current === category.id ? 'text-gold' : 'text-ink-soft'}`} style={{ height: 88 }}><span className={`mb-1 grid size-12 place-items-center rounded-full text-3xl ${current === category.id ? 'bg-gold/15 text-gold' : ''}`}>{category.icon}</span>{category.label}</button>)}</div></div>
}

function CategoryPage({ category, query, onCategory, onProvider, onLaunch, favoriteIds, onFavorite }) {
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
    const selected = CATEGORY_DATA.find((item) => item.id === category) || CATEGORY_DATA[0]
    if (selected.id === 'hot') return <HotPage query={query} category={selected} menuOpen={categoryMenuOpen} setMenuOpen={setCategoryMenuOpen} onCategory={onCategory} onLaunch={onLaunch} favoriteIds={favoriteIds} onFavorite={onFavorite} />
    const providers = selected.providers.map((code) => PROVIDER_BY_ASSET[code]).filter(Boolean).filter((provider) => provider.name.toLowerCase().includes(query.toLowerCase()))
    return <section className="relative min-h-full bg-page bg-[length:100%_auto] bg-top bg-no-repeat pb-20" style={{ backgroundImage: `url(${AWC}/assets/${selected.bg})` }}><button type="button" onClick={() => setCategoryMenuOpen(true)} className="absolute right-3 top-4 z-20 flex h-10 min-w-[130px] items-center justify-center gap-2 rounded-full border border-line bg-page/90 px-4 text-sm font-bold uppercase text-white"><span>{selected.icon}</span>{selected.label}<ChevronDown className="size-5" /></button><div className="pt-4" style={{ height: 270 }}>{selected.modal && <img src={`${AWC}/assets/${selected.modal}`} alt="" className="w-full object-cover" style={{ height: 254 }} />}</div><div className="relative z-10 -mt-[74px] grid grid-cols-3 gap-x-2 gap-y-3 px-2">{providers.map((provider) => <ProviderTile key={provider.assetCode} provider={provider} onSelect={onProvider} />)}</div>{categoryMenuOpen && <CategoryMenu current={selected.id} onPick={(id) => { onCategory(id); setCategoryMenuOpen(false) }} onClose={() => setCategoryMenuOpen(false)} />}</section>
}

function HotHero() {
    return <div className="relative overflow-hidden bg-cover bg-center" style={{ height: 253, backgroundImage: `url(${AWC}/assets/bg-new-Dlfy301l.jpg)` }}><img src={`${AWC}/assets/img-hot-title-BUxDWY6s.webp`} alt="" className="absolute left-3 top-8 w-[42%]" /><img src={`${AWC}/assets/img-character05-sDbRPrLU.webp`} alt="" className="absolute bottom-0 left-0 h-[75%]" /><img src={`${AWC}/assets/img-character03-aT9FiV9I.webp`} alt="" className="absolute bottom-0 left-[35%] h-[82%]" /><img src={`${AWC}/assets/img-character01-DGvqWRvb.webp`} alt="" className="absolute bottom-0 right-0 h-[78%]" /></div>
}

function HotPage({ query, category, menuOpen, setMenuOpen, onCategory, onLaunch, favoriteIds, onFavorite }) {
    const { games: hotGames, loading } = useHotGames()
    const games = hotGames.filter((game) => `${game.name} ${game.provider}`.toLowerCase().includes(query.toLowerCase()))
    return <section className="relative min-h-full bg-page pb-20 text-white"><HotHero /><button type="button" onClick={() => setMenuOpen(true)} className="absolute right-4 top-4 z-20 flex h-10 min-w-[130px] items-center justify-center gap-2 rounded-full border border-line bg-page/90 px-4 text-sm font-bold text-white"><span className="text-xl">♨</span>HOT<ChevronDown className="size-5" /></button><div className="relative z-10 -mt-10"><GameGrid games={games} favoriteIds={favoriteIds} onFavorite={onFavorite} onLaunch={onLaunch} loading={loading && !hotGames.length} /></div>{menuOpen && <CategoryMenu current={category.id} onPick={(id) => { onCategory(id); setMenuOpen(false) }} onClose={() => setMenuOpen(false)} />}</section>
}

function GameGrid({ games, favoriteIds = new Set(), onFavorite, onLaunch, loading = false }) {
    if (loading) return <Loader />
    if (!games.length) return <div className="grid min-h-[430px] place-items-center text-center text-ink-muted"><div><Search className="mx-auto mb-3 size-16 opacity-40" /><p>No games found</p></div></div>
    return <div className="grid grid-cols-3 gap-x-2 gap-y-3 p-2 pb-24">{games.map((game, index) => <article key={game.uid} className="relative min-w-0 pb-9 text-white"><button type="button" onClick={() => onLaunch?.(game)} className="relative mx-auto block aspect-square w-[94%] overflow-hidden rounded-lg border border-line bg-surface"><span className="absolute inset-x-0 top-0 z-10 h-4 truncate bg-black/70 px-1 text-left text-[8px] leading-4 text-white">{game.provider}</span><GameImage src={game.img} fallback={game.fallbackImg} placeholder={fallbackGame} alt={game.name} priority={index < 9} className="size-full object-cover" /></button><strong className="mt-1 block truncate px-1 text-[12px] font-semibold">{game.name}</strong><button type="button" onClick={() => onFavorite?.(game)} aria-label={`${favoriteIds.has(game.uid) ? 'Remove' : 'Add'} favorite`} className="absolute -right-2 bottom-3 grid size-14 place-items-center"><Star className={`size-9 stroke-gold stroke-[2] ${favoriteIds.has(game.uid) ? 'fill-gold' : 'fill-page'}`} /></button></article>)}</div>
}

// Rankings = admin's Hot list in admin's order (no hard-coded games).
function RankingsPage({ query, onLaunch }) {
    const { games: hotGames, loading } = useHotGames()
    const ranked = hotGames.map((game, index) => ({ ...game, rank: index + 1 }))
    if (loading && !hotGames.length) return <Loader />
    const rows = ranked.filter((game) => `${game.name} ${game.provider}`.toLowerCase().includes(query.toLowerCase()))
    return <section className="min-h-full bg-page pb-20 text-white"><img src={`${AWC}/image/banner/banner-4.png`} alt="" className="w-full object-cover" style={{ height: 144 }} /><div className="grid gap-y-3 bg-surface px-3 py-4 text-center text-[10px] text-ink-soft" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>{CATEGORY_DATA.map((category) => <div key={category.id}><span className="mx-auto mb-1 block text-2xl text-gold">{category.icon}</span>{category.label}</div>)}</div><div className="mt-3 flex h-12 items-center border-y border-line bg-surface px-3 text-sm font-bold"><span className="flex-1">♛ &nbsp;Most Popular Games</span><span className="border-l border-line px-3 text-ink-soft">⚙ &nbsp;More Rankings</span><ChevronDown className="size-5" /></div><div>{rows.map((game) => <article key={game.uid} className="relative flex items-center border-b-8 border-line bg-surface" style={{ height: 97 }}><span className="w-16 shrink-0 text-center text-lg">{game.rank < 4 ? <span className="text-3xl text-gold">♛</span> : game.rank}</span><GameImage src={game.img} fallback={game.fallbackImg} placeholder={fallbackGame} alt="" className="h-[92px] w-[145px] shrink-0 self-end object-contain object-bottom" /><div className="min-w-0 flex-1 pr-2 text-right"><small className="block truncate text-[10px] text-ink-muted">{game.provider}</small><strong className="block truncate text-sm">{game.name}</strong><button type="button" onClick={() => onLaunch(game)} className="mt-1 rounded bg-gold px-2 py-0.5 text-[8px] font-semibold text-on-gold">PLAY NOW ›</button></div><Star className="mr-2 size-7 fill-page stroke-gold" /></article>)}</div></section>
}

function ReportPage({ type }) {
    const labels = { transaction: ['Transaction History', 'Bet'], promotion: ['Promotion Report', 'Prize'], tip: ['Tip History', 'Tip'] }
    const [title, totalLabel] = labels[type]
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() - index); return date })
    const from = days[6].toLocaleDateString('en-GB').replaceAll('/', '-')
    const to = days[0].toLocaleDateString('en-GB').replaceAll('/', '-')
    return <section className="min-h-full bg-page px-2.5 pb-20 pt-5 text-white"><h2 className="flex items-center gap-2 text-base font-bold text-white">{type === 'transaction' ? <Clock3 /> : type === 'promotion' ? <FileChartColumn /> : <Coins />}{title}</h2><div className="mt-5 flex h-11 items-center rounded-md border border-line bg-surface px-3 text-[11px] font-bold text-ink-soft"><span className="flex-1">{from} ~ {to}</span><span>{totalLabel}</span><span className="ml-3 rounded-full bg-page px-3 py-1 text-white">0 <ChevronDown className="inline size-4" /></span></div><div className="mt-4 flex gap-2 overflow-hidden">{days.map((date) => <div key={date.toISOString()} className="grid h-16 min-w-16 place-items-center rounded-lg border border-line bg-surface text-center text-[11px] font-bold text-ink-soft"><span>{date.toLocaleDateString('en-US', { weekday: 'short' })}.</span><span>{String(date.getMonth() + 1).padStart(2, '0')}/{String(date.getDate()).padStart(2, '0')}</span></div>)}</div><div className="mt-4 grid h-28 place-items-center rounded-md border border-line bg-surface text-sm text-ink-muted">No data found</div></section>
}

function FeedbackPage() {
    const [rating, setRating] = useState(0)
    const [value, setValue] = useState('')
    return <section className="min-h-full bg-page px-2.5 pb-24 pt-5 text-white"><h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white"><MessageSquareText />Feedback</h2><div className="overflow-hidden rounded-md border border-line bg-surface"><h3 className="bg-surface p-4 text-sm text-white"><span className="text-gold">*</span> How would you rate the gaming experience<br />in the lobby?</h3><div className="p-4"><div className="flex justify-center">{[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" onClick={() => setRating(number)}><Star className={`size-11 ${number <= rating ? 'fill-gold text-gold' : 'fill-line-strong text-ink-dim'}`} /></button>)}</div><p className="mt-4 text-sm text-ink-muted">Your feedback is valuable to us.</p></div></div><div className="mt-4 overflow-hidden rounded-md border border-line bg-surface"><h3 className="bg-surface p-4 text-sm text-white"><span className="text-gold">*</span> Any feedback to us?</h3><div className="p-4"><textarea value={value} maxLength={120} onChange={(event) => setValue(event.target.value)} className="h-52 w-full resize-none rounded-lg border border-line bg-page p-3 text-white outline-none focus:border-gold" /><div className="mt-2 flex text-sm text-ink-muted"><span className="flex-1">Max length: 120 characters.</span><span>({value.length}/120)</span></div></div></div><button type="button" disabled={!rating || !value.trim()} className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-gold font-semibold text-on-gold disabled:opacity-40"><Send className="mr-2 size-4" />Send Feedback</button></section>
}

function HallMenu({ language, onLanguage, onPage, onQuit, onClose }) {
    const reports = [['transaction', 'Transaction History', <Clock3 key="transaction" />], ['promotion', 'Promotion Report', <FileChartColumn key="promotion" />], ['tip', 'Tip History', <Coins key="tip" />]]
    return <div className="absolute inset-0 z-50 flex bg-black/65"><button type="button" aria-label="Close menu" onClick={onClose} className="h-full" style={{ width: '20%' }} /><aside className="relative h-full overflow-y-auto bg-page px-3 py-4 text-white shadow-2xl" style={{ width: '80%' }}><button type="button" onClick={onClose} aria-label="Close menu" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-surface text-white"><X className="size-4" /></button><h3 className="mb-3 text-[13px] font-bold text-ink-muted">Language</h3><div className="mb-6 grid gap-1 text-center text-[10px]" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>{[['EN', '🇬🇧'], ['THAI', '🇹🇭'], ['CN', '🇨🇳'], ['JP', '🇯🇵'], ['VN', '🇻🇳'], ['KR', '🇰🇷']].map(([code, flag]) => <button key={code} type="button" onClick={() => onLanguage(code)} className={`py-2 ${language === code ? 'rounded-lg bg-surface text-gold' : 'opacity-45'}`}><span className="block text-xl">{flag}</span>{code}</button>)}</div><h3 className="mb-2 text-[13px] font-bold text-ink-muted">Reporting</h3><ul>{reports.map(([id, label, icon]) => <li key={id}><button type="button" onClick={() => onPage(id)} className="flex h-12 w-full items-center border-b border-line text-left text-[15px] text-white">{icon}<span className="ml-3 flex-1">{label}</span><ChevronRight className="text-ink-muted" /></button></li>)}</ul><h3 className="mb-2 mt-4 text-[13px] font-bold text-ink-muted">Other</h3><button type="button" onClick={() => onPage('feedback')} className="flex h-12 w-full items-center text-left text-[15px] text-white"><MessageSquareText /><span className="ml-3 flex-1">Feedback</span></button><button type="button" onClick={onQuit} className="mx-auto mt-8 block h-10 w-full rounded-lg border border-line text-sm text-ink-soft">Quit</button></aside></div>
}

export default function GameHall({ open, onClose }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const user = useSelector((state) => state.auth.user)
    const [section, setSection] = useState('platform')
    const [page, setPage] = useState('home')
    const [category, setCategory] = useState('hot')
    const [grid, setGrid] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedProvider, setSelectedProvider] = useState(null)
    const [localProviders, setLocalProviders] = useState([])
    const [games, setGames] = useState([])
    const [gameMeta, setGameMeta] = useState({})
    const [loading, setLoading] = useState(false)
    const [launching, setLaunching] = useState('')
    const [error, setError] = useState('')
    const [gameUrl, setGameUrl] = useState('')
    const [recent, setRecent] = useState(() => readStored(RECENT_KEY))
    const [favorites, setFavorites] = useState(readFavorites)
    const [menuOpen, setMenuOpen] = useState(false)
    const [language, setLanguage] = useState('EN')
    const historyPushed = useRef(false)
    const refreshRun = useRef(0)
    const walletRef = useRef(user?.wallet)
    const contentRef = useRef(null)
    const {
        containerRef: gameContainerRef,
        immersive,
        enterImmersive,
        leaveImmersive,
        exitGestureProps,
    } = useMobileGameImmersion()

    useEffect(() => {
        walletRef.current = user?.wallet
    }, [user?.wallet])

    const refreshWalletAfterExit = useCallback(async () => {
        const run = ++refreshRun.current
        const fallbackWallet = walletRef.current
        const delays = [0, 500, 1000, 2000]
        for (const [index, delay] of delays.entries()) {
            await new Promise((resolve) => window.setTimeout(resolve, delay))
            if (run !== refreshRun.current) return
            try {
                dispatch(setUser(await fetchFreshAccount({
                    liveExposure: true,
                    preserveWallet: index < delays.length - 1 ? fallbackWallet : null,
                })))
            } catch {
                // A later pass or manual refresh can retry the account sync.
            }
        }
    }, [dispatch])

    const closeHall = useCallback(() => {
        leaveImmersive()
        setGameUrl('')
        api.post('/api/9w/close', {}).catch(() => {})
        refreshWalletAfterExit()
        onClose()
        if (historyPushed.current && window.history.state?.velkiGameHall) window.history.back()
        historyPushed.current = false
    }, [leaveImmersive, onClose, refreshWalletAfterExit])

    const closeGame = useCallback(() => {
        leaveImmersive()
        setGameUrl('')
        api.post('/api/9w/close', {}).catch(() => {})
        refreshWalletAfterExit()
    }, [leaveImmersive, refreshWalletAfterExit])

    // The provider's own exit button lands on /game-return.html inside the frame.
    useEffect(() => {
        if (!gameUrl) return undefined
        const closeOnProviderExit = (event) => {
            if (event.origin === window.location.origin && event.data === 'velki:game-exit') closeGame()
        }
        window.addEventListener('message', closeOnProviderExit)
        return () => window.removeEventListener('message', closeOnProviderExit)
    }, [closeGame, gameUrl])

    useEffect(() => {
        if (!open) return undefined
        const previousOverflow = document.body.style.overflow
        let active = true
        document.body.style.overflow = 'hidden'
        Promise.resolve().then(() => {
            if (!active) return
            setSection('platform')
            setPage('home')
            setCategory('hot')
            setQuery('')
            setSelectedProvider(null)
            setMenuOpen(false)
            setError('')
        })
        if (!historyPushed.current) { window.history.pushState({ ...window.history.state, velkiGameHall: true }, ''); historyPushed.current = true }
        const closeOnBack = () => { historyPushed.current = false; leaveImmersive(); refreshWalletAfterExit(); onClose() }
        window.addEventListener('popstate', closeOnBack)
        let providerRetryTimer
        let providerAttempt = 0
        const loadProviders = () => {
            api.get('/api/9w/hall/providers').then((response) => {
                if (!active) return
                const incoming = Array.isArray(response.data) ? response.data : []
                setLocalProviders((current) => response.meta?.loading
                    ? mergeProviders(current, incoming)
                    : incoming)
                if (response.meta?.loading && providerAttempt < 30) {
                    providerAttempt += 1
                    providerRetryTimer = window.setTimeout(loadProviders, 1500)
                }
            }).catch(() => {})
        }
        loadProviders()
        return () => { active = false; window.clearTimeout(providerRetryTimer); document.body.style.overflow = previousOverflow; window.removeEventListener('popstate', closeOnBack) }
    }, [leaveImmersive, onClose, open, refreshWalletAfterExit])

    useEffect(() => {
        if (!open || !selectedProvider) return undefined
        let active = true
        let retryTimer
        let attempt = 0
        const loadGames = () => {
            setLoading(true)
            setError('')
            const params = new URLSearchParams({ provider: selectedProvider.localCode, limit: '60' })
            if (query.trim()) params.set('search', query.trim())
            api.get(`/api/9w/hall/games?${params}`).then((response) => {
                if (!active) return
                const incoming = (response.data || []).map(normalizeGame)
                setGames((current) => response.meta?.loading ? mergeGames(current, incoming) : incoming)
                setGameMeta(response.meta || {})
                if (response.meta?.loading && attempt < 30) {
                    attempt += 1
                    retryTimer = window.setTimeout(loadGames, 1500)
                } else {
                    setLoading(false)
                }
            }).catch((requestError) => {
                if (!active) return
                setError(requestError.message || 'Unable to load games')
                setLoading(false)
            })
        }
        const timer = window.setTimeout(loadGames, 80)
        return () => { active = false; window.clearTimeout(timer); window.clearTimeout(retryTimer) }
    }, [open, query, selectedProvider])

    useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0 }, [category, page, section, selectedProvider])

    const providers = useMemo(() => {
        const available = new Map(localProviders.map((provider) => [String(provider.code).toLowerCase(), provider]))
        return PROVIDERS.map((provider) => ({ ...provider, available: available.has(provider.localCode.toLowerCase()) }))
    }, [localProviders])
    const favoriteIds = useMemo(() => new Set(favorites.map((game) => game.uid)), [favorites])

    const changeSection = (next) => {
        setPage('home')
        setMenuOpen(false)
        setSection(next)
        setSelectedProvider(null)
        setQuery('')
        if (next === 'recent') setRecent(readStored(RECENT_KEY))
        if (next === 'favorite') setFavorites(readFavorites())
    }

    const selectProvider = (provider) => { setGames([]); setGameMeta({}); setSection('games'); setSelectedProvider(provider); setQuery('') }
    const changeQuery = (value) => { setGames([]); setGameMeta({}); setQuery(value) }
    const handleFavorite = (game) => { toggleFavorite(game); setFavorites(readFavorites()) }

    const resolveReferenceGame = async (game) => {
        if (!String(game.uid).startsWith('reference:')) return game
        const response = await api.get(`/api/9w/hall/games?search=${encodeURIComponent(game.name)}&limit=20`)
        const matches = (response.data || []).map(normalizeGame)
        return matches.find((candidate) => candidate.name.trim().toLowerCase() === game.name.trim().toLowerCase()) || matches[0] || null
    }

    const launchGame = async (displayGame) => {
        if (!isLoggedIn) { closeHall(); navigate('/login', { state: { returnTo: window.location.pathname + window.location.search } }); return }
        if (launching) return
        setLaunching(displayGame.uid)
        setError('')
        // Own tab, reserved during the click (browsers block it after an await).
        // Blocked: the game opens inside the hall as before.
        const gameTab = reserveCasinoGameTab()
        try {
            const game = await resolveReferenceGame(displayGame)
            if (!game) throw new Error('This provider game is temporarily unavailable.')
            const response = await api.post('/api/9w/launch', { game_uid: game.uid, wallet_mode: 'both', language: 'en', platform: 2 })
            const gameUrl = validatedGameLaunchUrl(response.data?.game_url)
            setRecent(saveRecentGame({ ...game, img: displayGame.img || game.img }))
            if (gameTab && !gameTab.closed) {
                showCasinoGame(gameTab, gameUrl)
            } else {
                leaveImmersive()
                setGameUrl(gameUrl)
            }
        } catch (launchError) {
            cancelCasinoGameTab(gameTab)
            setError(launchError.message || 'Unable to launch this game right now.')
        }
        finally { setLaunching('') }
    }

    const loadMore = async () => {
        if (!selectedProvider || !gameMeta.has_next || loading) return
        setLoading(true)
        try {
            const params = new URLSearchParams({ provider: selectedProvider.localCode, limit: '60', page: String((gameMeta.page || 1) + 1) })
            if (query.trim()) params.set('search', query.trim())
            const response = await api.get(`/api/9w/hall/games?${params}`)
            setGames((current) => [...current, ...(response.data || []).map(normalizeGame)])
            setGameMeta(response.meta || {})
        } catch (requestError) { setError(requestError.message || 'Unable to load more games') }
        finally { setLoading(false) }
    }

    if (!open) return null

    let body
    if (page === 'transaction' || page === 'promotion' || page === 'tip') body = <ReportPage type={page} />
    else if (page === 'feedback') body = <FeedbackPage />
    else if (section === 'platform') body = <PlatformPage query={query} grid={grid} providers={providers} onGrid={setGrid} onSelect={selectProvider} />
    else if (section === 'rankings') body = <RankingsPage query={query} onLaunch={launchGame} />
    else if (section === 'recent' || section === 'favorite') {
        const rows = section === 'recent' ? recent : favorites
        body = rows.length ? <div className="min-h-full bg-page"><GameGrid games={rows.filter((game) => `${game.name} ${game.provider}`.toLowerCase().includes(query.toLowerCase()))} favoriteIds={favoriteIds} onFavorite={handleFavorite} onLaunch={launchGame} /></div> : <EmptyState kind={section} />
    } else if (selectedProvider) body = <div className="min-h-full bg-page pt-2"><h2 className="px-3 pb-2 text-base font-bold text-white">{selectedProvider.name}</h2><GameGrid games={games} loading={loading} favoriteIds={favoriteIds} onFavorite={handleFavorite} onLaunch={launchGame} />{gameMeta.has_next && <button type="button" onClick={loadMore} className="mx-auto mb-24 block rounded-full border border-gold px-6 py-2 text-xs text-gold">LOAD MORE</button>}</div>
    else body = <CategoryPage category={category} query={query} onCategory={setCategory} onProvider={selectProvider} onLaunch={launchGame} favoriteIds={favoriteIds} onFavorite={handleFavorite} />

    const showSearch = section !== 'platform' || page !== 'home'
    return (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center overflow-y-auto bg-black/65">
            <section ref={gameContainerRef} role="dialog" aria-modal="true" aria-label="Game hall" className={`relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-black ${immersive ? 'max-w-none' : 'max-w-[480px]'}`}>
                {!immersive && (
                    <div className="flex h-12 shrink-0 items-center justify-between bg-black px-2">
                        <img src={velkiLogo} alt="chorkix.com" className="ml-2 h-7 w-auto max-w-28 object-contain object-left" />
                        <button type="button" onClick={gameUrl ? closeGame : closeHall} aria-label={gameUrl ? 'Close game' : 'Close game hall'} className="grid size-10 place-items-center text-white">
                            <X className="size-6" />
                        </button>
                    </div>
                )}
                {gameUrl ? (
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
                        <iframe title="chorkix.com Game" src={gameUrl} className="absolute inset-0 size-full border-0 bg-black" allow="autoplay; fullscreen; payment" allowFullScreen />
                        {!immersive && (
                            <button type="button" onClick={enterImmersive} aria-label="Enter fullscreen game" className="absolute inset-0 z-10 block bg-transparent md:hidden" />
                        )}
                        {immersive && (
                            <button type="button" onClick={leaveImmersive} aria-label="Exit fullscreen game" className="absolute inset-x-0 top-0 z-20 flex h-7 touch-pan-y items-start justify-center bg-gradient-to-b from-black/25 to-transparent pt-1 md:hidden" {...exitGestureProps}>
                                <span className="h-1 w-10 rounded-full bg-white/60 shadow" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-page">
                        <HallHeader user={user} onMenu={() => setMenuOpen(true)} query={query} onQuery={changeQuery} showSearch={showSearch} />
                        <main ref={contentRef} className="absolute inset-x-0 overflow-y-auto" style={{ top: showSearch ? 114 : 60, bottom: 65 }}>{body}</main>
                        {error && <div role="alert" className="absolute inset-x-3 top-[122px] z-40 rounded bg-red-950/95 p-3 text-xs text-white shadow">{error}<button type="button" onClick={() => setError('')} className="float-right"><X className="size-4" /></button></div>}
                        {launching && <div className="absolute inset-0 z-40 grid place-items-center bg-black/45"><Loader label="Opening game…" className="text-white" /></div>}
                        <BottomNavigation active={section} onChange={changeSection} />
                        {menuOpen && <HallMenu language={language} onLanguage={setLanguage} onPage={(nextPage) => { setPage(nextPage); setMenuOpen(false) }} onQuit={closeHall} onClose={() => setMenuOpen(false)} />}
                    </div>
                )}
            </section>
        </div>
    )
}
