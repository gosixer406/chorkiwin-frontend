import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageTitle from '@/components/dashboard/page-title'
import { Pagination } from '@/components/dashboard/activity-log'
import { api } from '@/lib/api'
import { DISPLAY_CURRENCY } from '@/lib/currency'
import useSiteFeatures from '@/hooks/use-site-features'

const TABS = [
    { id: 'daily', label: 'Daily', title: 'Daily Loss Back', rule: 'of your loss for each day, paid just after midnight (Bangladesh time).' },
    { id: 'weekly', label: 'Weekly', title: 'Weekly Loss Back', rule: 'of your loss for each week (Monday to Sunday), paid on Monday at 00:00 (Bangladesh time).' },
    { id: 'monthly', label: 'Monthly', title: 'Monthly Loss Back', rule: 'of your loss for each month, paid on the 1st at 00:00 (Bangladesh time).' },
]

const STATUS = {
    credited: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-400' },
    pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-400' },
    rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400' },
    reversed: { label: 'Reversed', className: 'bg-red-500/15 text-red-400' },
}

const DAY_MS = 86400_000
const money = (value) => `${DISPLAY_CURRENCY} ${Number(value || 0).toFixed(2)}`

// Period keys and payout dates are Bangladesh calendar dates, so they are
// shown as written instead of being shifted into the viewer's time zone.
const calendarDate = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => {
    const time = typeof value === 'number' ? value : Date.parse(`${value}T00:00:00Z`)
    return Number.isNaN(time) ? String(value || '') : new Date(time).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' })
}

const periodLabel = (program, period) => {
    if (program === 'monthly') return calendarDate(`${period}-01`, { month: 'long', year: 'numeric' })
    if (program === 'daily') return calendarDate(period)
    const start = Date.parse(`${period}T00:00:00Z`)
    if (Number.isNaN(start)) return String(period || '')
    return `${calendarDate(start, { day: '2-digit', month: 'short' })} – ${calendarDate(start + 6 * DAY_MS)}`
}

function Detail({ label, children }) {
    return <div className="min-w-0">
        <span className="block text-[10px] text-ink-muted">{label}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-ink">{children}</span>
    </div>
}

function LossBackPanel({ tab }) {
    const [data, setData] = useState(null)
    const [meta, setMeta] = useState({})
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get(`/api/referral/loss-back?program=${tab.id}&page=${page}&limit=10`, { cache: 'no-store' })
            .then((response) => {
                if (!active) return
                setData(response.data || {})
                setMeta(response.meta || {})
                setError('')
            })
            .catch((requestError) => active && setError(requestError.message || 'Unable to load loss back.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [tab.id, page])

    const changePage = (next) => {
        if (next < 1 || next === page) return
        setLoading(true)
        setPage(next)
    }

    const rows = data?.rows || []
    return <>
        {data && <div className="rounded-md bg-linear-to-r from-(--menu-banner-from) via-(--menu-banner-via) to-(--menu-banner-to) p-4 text-white">
            <p className="text-xs font-medium text-(--menu-banner-sub)">Total {tab.title}</p>
            <strong className="mt-1 block text-2xl">{money(data.total_paid)}</strong>
            {data.total_pending > 0 && <p className="mt-1 text-xs text-(--menu-banner-sub)">Pending: {money(data.total_pending)}</p>}
        </div>}

        {data && <p className="rounded-md border border-line bg-surface px-3.5 py-3 font-poppins text-[11px] leading-4 text-ink-soft">
            {data.enabled
                ? <>Get <strong className="text-gold">{data.pct}%</strong> {tab.rule}{data.next_payout_date && <> Next payout: <strong className="text-ink">{calendarDate(data.next_payout_date)}</strong>.</>}</>
                : `${tab.title} is currently not available.`}
        </p>}

        {loading && <Loader />}
        {error && <div role="alert" className="rounded-md border border-[#772C2C] bg-[#C52B2B]/10 p-3 text-sm text-[#FF7A84]">{error}</div>}
        {!loading && !error && rows.length === 0 && <p className="py-12 text-center font-poppins text-xs text-ink-muted">No {tab.title.toLowerCase()} records found.</p>}

        {!loading && rows.map((row) => {
            const status = STATUS[row.status] || { label: row.status, className: 'bg-surface-2 text-ink-soft' }
            return <article key={row.id} className="rounded-md border border-line bg-surface px-3.5 py-3 font-poppins">
                <div className="flex items-center justify-between gap-3">
                    <strong className="min-w-0 truncate text-[13px] font-semibold text-ink">{periodLabel(tab.id, row.period)}</strong>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${status.className}`}>{status.label}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2">
                    <Detail label="Loss">{money(row.loss_amount)}</Detail>
                    <Detail label="Rate">{row.pct}%</Detail>
                    <Detail label="Loss Back"><span className="text-emerald-400">{money(row.amount)}</span></Detail>
                </div>
                {row.created_at && <p className="mt-2 text-[10px] text-ink-muted">{new Date(row.created_at).toLocaleString('en-GB')}</p>}
            </article>
        })}
        {!loading && <Pagination meta={meta} page={page} onChange={changePage} />}
    </>
}

export default function LossBack() {
    const [searchParams, setSearchParams] = useSearchParams()
    const features = useSiteFeatures()
    // Only the periods this site has switched on.
    const tabs = TABS.filter((item) => features.loss_back?.[item.id])
    const tab = tabs.find((item) => item.id === searchParams.get('tab')) || tabs[0]

    return <>
        <PageTitle title="Loss Back" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        <section className="space-y-2 px-[13px] py-3" aria-label="Loss back">
            {!tab && <p className="py-12 text-center font-poppins text-xs text-ink-muted">Loss Back is currently not available.</p>}
            {tab && <>
            <div role="tablist" aria-label="Loss back period" className="flex rounded-md border border-line bg-surface p-1">
                {tabs.map((item) => <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={item.id === tab.id}
                    onClick={() => setSearchParams({ tab: item.id }, { replace: true })}
                    className={`flex-1 rounded-[3px] py-2 font-poppins text-[12px] tracking-tight ${item.id === tab.id ? 'bg-linear-to-b from-gold-light to-gold-dark font-semibold text-on-gold' : 'text-ink-muted hover:text-ink'}`}
                >{item.label}</button>)}
            </div>
            {/* Keyed so each period starts on its own first page with no data from the last tab. */}
            <LossBackPanel key={tab.id} tab={tab} />
            </>}
        </section>
    </>
}
