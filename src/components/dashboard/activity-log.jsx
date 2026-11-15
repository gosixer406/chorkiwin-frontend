import { Laptop } from 'lucide-react'

const formatDate = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
}

export function LogRow({ row, passwordLog = false }) {
    const location = [row.city, row.region, row.country].filter(Boolean).join(' / ') || row.location || '- / - / -'
    const status = row.status || row.activity || (passwordLog ? 'Password Changed' : 'Login Status')
    const failed = /fail|denied|invalid|blocked/i.test(String(status))
    return <article className="border-b border-line py-3 last:border-b-0">
        <div className="mb-2 flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 font-poppins text-xs font-semibold text-ink">
                <Laptop className="size-4 shrink-0" strokeWidth={1.5} /><span className="truncate">{formatDate(row.created_at || row.date)}</span>
            </span>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-poppins text-[10px] leading-[1.35] text-ink-soft">
            <span>{passwordLog ? 'Status' : 'Login Status'}</span><span className={`text-right font-semibold ${failed ? 'text-[#FF3B3B]' : 'text-[#00C21A]'}`}>{status}</span>
            <span>City/State/Country</span><span className="break-words text-right text-ink-muted">{location}</span>
            <span>IP Address</span><span className="break-all text-right text-ink-muted">{row.ip_address || row.ip || '—'}</span>
            <span>ISP</span><span className="break-words text-right text-ink-muted">{row.isp || '—'}</span>
        </div>
    </article>
}

export function Pagination({ meta, page, onChange }) {
    const pages = Math.max(Number(meta?.pages || 1), 1)
    if (pages <= 1) return null
    const candidates = [1, page - 1, page, page + 1, pages]
        .filter((value, index, all) => value >= 1 && value <= pages && all.indexOf(value) === index)
        .sort((a, b) => a - b)
    return <div className="flex items-center justify-center gap-1 pt-3 text-xs">
        <button disabled={!meta.has_prev} onClick={() => onChange(page - 1)} className="grid size-7 place-items-center rounded border border-line bg-page disabled:opacity-40">‹</button>
        {candidates.map((value, index) => <span key={value} className="contents">
            {index > 0 && value - candidates[index - 1] > 1 && <span className="px-1 text-ink-muted">…</span>}
            <button onClick={() => onChange(value)} className={`grid size-7 place-items-center rounded ${value === page ? 'bg-linear-to-b from-gold-light to-gold-dark font-semibold text-on-gold' : 'border border-line bg-page'}`}>{value}</button>
        </span>)}
        <button disabled={!meta.has_next} onClick={() => onChange(page + 1)} className="grid size-7 place-items-center rounded border border-line bg-page disabled:opacity-40">›</button>
    </div>
}
