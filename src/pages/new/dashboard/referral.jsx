import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { requestAccountRefresh } from '@/lib/refresh-account'
import { useSelector } from 'react-redux'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import PageTitle from '@/components/dashboard/page-title'
import poster from '@/assets/img/logo/referral-banner.png'
import { api } from '@/lib/api'
import { SIGNUP_URL } from '@/lib/links'

// The API has sent the join time under several names; take whichever is present.
function formatJoinDate(row) {
    const value = row.created_at || row.createdAt || row.joined_at || row.join_date
    const date = value ? new Date(value) : null
    if (!date || Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Referral() {
    const [tab, setTab] = useState('invite')
    const [data, setData] = useState(null)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const user = useSelector((state) => state.auth.user)

    useEffect(() => {
        api.get('/api/referral/summary')
            .then((response) => setData(response.data))
            .catch((requestError) => setError(requestError.message))
    }, [])

    // The username is the referral code; the QR encodes it.
    const code = user?.username || data?.code || ''
    const invitedUsers = data?.invited_users || data?.tree_users || []

    async function copy(value, text) {
        await navigator.clipboard.writeText(value)
        setMessage(text)
    }

    async function share() {
        try {
            if (navigator.share) await navigator.share({ title: 'Join Chorkiwala', text: `Use my invitation code ${code}`, url: SIGNUP_URL })
            else await copy(code, 'Invitation code copied')
        } catch {
            // The user closed the share sheet.
        }
    }

    async function claim() {
        setError('')
        try {
            const response = await api.post('/api/referral/claim', {})
            setMessage(response.message || 'Referral bonus claimed')
            setData(response.data)
            requestAccountRefresh()
        } catch (requestError) { setError(requestError.message) }
    }

    return (
        <div className="flex min-h-dvh flex-col bg-page">
            <header className="sticky top-0 z-20 bg-account-header">
                <PageTitle title="Referral" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
                <div className="grid grid-cols-2" role="tablist" aria-label="Referral tabs">
                    {['invite', 'details'].map((value) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === value}
                            key={value}
                            onClick={() => setTab(value)}
                            className={`h-[38px] border-b-[3px] text-[14px] font-medium capitalize transition-colors ${tab === value ? 'border-white text-white' : 'border-transparent text-white/60'}`}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex flex-col gap-2 px-2.5 py-3 text-white">
                {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
                {message && <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
                {!data && !error && <Loader />}

                {data && tab === 'invite' && <>
                    <img src={poster} className="block aspect-[2.5/1] w-full rounded-lg object-cover" alt="Invite a friend" />
                    <section className="rounded-md border border-line bg-surface px-3.5 py-4">
                        <div className="flex items-center gap-2.5">
                            <span className="h-5 w-[5px] rounded-full bg-gold" />
                            <h2 className="font-poppins text-[14px] font-semibold text-white">Refer Your Friends and Earn</h2>
                        </div>
                        <div className="mt-4 flex">
                            <div className="flex shrink-0 flex-col items-center gap-2 border-r border-line-strong pr-2">
                                <span className="font-poppins text-[11px] font-medium">Invitation QR Code</span>
                                <div className="rounded-[3px] border-2 border-gold bg-white p-1">
                                    {code ? <QRCodeSVG value={code} size={96} level="M" /> : <div className="size-[96px]" />}
                                </div>                            </div>
                            <div className="flex min-w-0 flex-1 flex-col pl-2">
                                <span className="font-poppins text-[11px] font-medium">Invitation URL</span>
                                <button type="button" onClick={share} disabled={!code} className="mt-2.5 h-[44px] w-full rounded-md bg-linear-to-b from-gold-light to-gold-dark font-poppins text-[15px] font-semibold text-on-gold disabled:opacity-50">Share</button>
                                <span className="mt-5 font-poppins text-[11px] font-medium">Invitation Code</span>
                                <div className="mt-2 flex h-[44px] items-center justify-between gap-2 rounded-md border border-line bg-page px-3">
                                    <span className="truncate font-poppins text-[13px] font-semibold tracking-wide text-gold">{code || '—'}</span>
                                    <button type="button" onClick={() => copy(code, 'Invitation code copied')} disabled={!code} aria-label="Copy invitation code" className="shrink-0 text-ink-muted hover:text-gold"><Copy className="size-5 -scale-x-100" /></button>
                                </div>
                            </div>
                        </div>
                    </section>
                    {Number(data.dashboard?.claimable_amount || 0) > 0 && <button type="button" onClick={claim} className="h-[38px] w-full rounded-[3px] bg-linear-to-b from-gold-light to-gold-dark text-[13px] font-semibold text-on-gold">Claim referral bonus (USD {Number(data.dashboard.claimable_amount).toFixed(2)})</button>}
                </>}

                {data && tab === 'details' && (
                    <div className="overflow-hidden rounded-md border border-line bg-surface">
                        <div className="grid grid-cols-2 bg-surface font-poppins text-[11px] font-medium">
                            <span className="border-r border-line py-2.5 text-center">Invited Users</span>
                            <span className="py-2.5 text-center">Joining Date</span>
                        </div>
                        {invitedUsers.length === 0
                            ? <p className="border-t border-line py-10 text-center font-poppins text-[12px] text-ink-muted">No referrals found</p>
                            : invitedUsers.map((row, index) => (
                                <div key={row.id || index} className="grid grid-cols-2 border-t border-line font-poppins text-[12px]">
                                    <span className="truncate border-r border-line px-2 py-2.5 text-center">{row.username || row.masked_username || 'Invited player'}</span>
                                    <span className="py-2.5 text-center text-ink-soft">{formatJoinDate(row)}</span>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    )
}
