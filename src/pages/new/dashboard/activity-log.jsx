import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import { LogRow, Pagination } from '@/components/dashboard/activity-log'
import { api } from '@/lib/api'

export default function ActivityLog() {
    const [page, setPage] = useState(1)
    const [logs, setLogs] = useState([])
    const [meta, setMeta] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get(`/api/auth/activity-logs?page=${page}&limit=10`)
            .then((response) => {
                if (!active) return
                setLogs(response.data || [])
                setMeta(response.meta || {})
            })
            .catch((requestError) => active && setError(requestError.message || 'Unable to load the log.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [page])

    const changePage = (next) => {
        if (next < 1 || next === page) return
        setLoading(true)
        setError('')
        setPage(next)
    }

    return <div className="min-h-dvh bg-page text-white">
        <header className="sticky top-0 z-20 bg-bar">
            <PageTitle title="Activity Log" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-bar px-3! text-ink" />
        </header>
        <main className="px-2.5 pb-8 pt-3">
            <div className="rounded-md border border-line bg-surface px-3.5 py-4">
                <h2 className="font-poppins text-[14px] font-bold text-white">Activity Log</h2>
                <div className="mt-3 h-px bg-line-strong" />
                <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-surface px-2.5 py-2.5 font-poppins text-[10px] text-ink-soft"><span>Device</span><span>Action</span></div>
                {error && <p role="alert" className="mt-3 rounded-md border border-[#772C2C] bg-[#C52B2B]/10 p-2.5 text-xs text-[#FF7A84]">{error}</p>}
                {loading && <p className="py-10 text-center text-xs text-ink-muted">Loading…</p>}
                {!loading && logs.map((row) => <LogRow key={row.id} row={row} />)}
                {!loading && !error && logs.length === 0 && <p className="py-12 text-center font-poppins text-xs text-ink-muted">No Data Found!</p>}
                {!loading && <Pagination meta={meta} page={page} onChange={changePage} />}
            </div>
        </main>
    </div>
}
