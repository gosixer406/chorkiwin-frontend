import PageTitle from "../../components/dashboard/page-title";
import CommonInner from "../../layout/dashboard/common-inner";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ActiveLog() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        api.get('/api/auth/activity-logs?limit=50')
            .then((response) => active && setItems(response.data || []))
            .catch((requestError) => active && setError(requestError.message || 'Unable to load activity.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [])

    return (
        <>
            <PageTitle
                title="Active Log"
            />
            <CommonInner>
                {loading && <p className="py-18 text-center text-sm text-[#657583]">Loading activity…</p>}
                {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                {!loading && !error && items.length === 0 && <p className="py-18 text-center text-sm text-[#657583]">No activity recorded.</p>}
                <div className="flex flex-col gap-y-4">
                    {items.map((item, idx) => {
                        const date = item.created_at ? new Date(item.created_at).toLocaleString() : '—'
                        const locationParts = [item.city, item.region, item.postal, item.country]
                            .filter((value, partIndex, all) => value && all.indexOf(value) === partIndex)
                        const location = locationParts.join(', ') || item.location || 'Unknown'
                        return (
                        <div className="rounded-xl overflow-hidden bg-white" key={idx}>
                            <div className="min-h-9.5 flex items-center px-3 bg-[#E8EEF2] text-[#388E41]">
                                {date}
                            </div>
                            <div className="px-3 flex flex-col gap-y-2">
                                <div className="flex min-h-9.5 items-center justify-between not-last:border-b border-solid border-[#D8E3E9] text-sm leading-[130%] font-medium text-[#3c4153]">
                                    <span>Login Status</span>
                                    <span className={item.success ? 'text-[#388E41]' : 'text-red-600'}>{item.status || date}</span>
                                </div>
                                <div className="flex min-h-9.5 items-center justify-between not-last:border-b border-solid border-[#D8E3E9] text-sm leading-[130%] font-medium text-[#3c4153]">
                                    <span>IP Address</span>
                                    <span className="max-w-[65%] break-all text-right">{item.ip_address || 'Unknown'}</span>
                                </div>
                                <div className="flex min-h-9.5 items-center justify-between not-last:border-b border-solid border-[#D8E3E9] text-sm leading-[130%] font-medium text-[#3c4153]">
                                    <span>ISP</span>
                                    <span className="max-w-[65%] break-words text-right">{item.isp || 'Unknown'}</span>
                                </div>
                                <div className="flex min-h-9.5 items-center justify-between not-last:border-b border-solid border-[#D8E3E9] text-sm leading-[130%] font-medium text-[#3c4153]">
                                    <span>City/State/Postal/Country</span>
                                    <span className="max-w-[60%] break-words text-right">{location}</span>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </CommonInner>
        </>
    )
}
