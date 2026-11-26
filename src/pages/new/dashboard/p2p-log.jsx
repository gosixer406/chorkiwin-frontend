import { DISPLAY_CURRENCY } from '@/lib/currency'
import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import PageTitle from '@/components/dashboard/page-title'
import NotAvailable from '@/utilities/icons/not-available'
import { api } from '@/lib/api'

// Same records and rules as the b2b-frontend transaction list, in this site's
// dark theme. Payment Transfer Log: the player's deposit and withdrawal
// requests. P2p Log: wallet-to-wallet transfers. Each tab reads only its own
// records from the server, so game rounds never push them off the list.

const rowsOf = (response) => (Array.isArray(response?.data) ? response.data : response?.data?.rows || [])

function normalizeDeposit(row) {
    const detail = row.transaction_id
        ? `Transaction ID: ${row.transaction_id}`
        : row.gateway_ref
            ? `Reference: ${row.gateway_ref}`
            : row.sender_number
                ? `From: ${row.sender_number}`
                : 'Deposit request'
    return {
        ...row,
        key: `deposit-${row.id}`,
        title: 'Deposit',
        // What reached the wallet (after any fee).
        amount: Math.abs(Number(row.net_amount ?? row.amount ?? 0)),
        description: detail,
    }
}

function normalizeWithdrawal(row) {
    const detail = row.gateway_ref
        ? `Reference: ${row.gateway_ref}`
        : row.recipient_number
            ? `To: ${row.recipient_number}`
            : row.bank_account
                ? `To account: ${row.bank_account}`
                : 'Withdrawal request'
    return {
        ...row,
        key: `withdrawal-${row.id}`,
        title: 'Withdrawal',
        amount: -Math.abs(Number(row.amount ?? 0)),
        description: row.rejection_reason ? `${detail} · Reason: ${row.rejection_reason}` : detail,
    }
}

function normalizeP2p(row) {
    const direction = row.metadata_json?.direction
    const other = row.metadata_json?.counterparty
    return {
        ...row,
        key: `p2p-${row.id}`,
        title: direction === 'out'
            ? 'P2P Transfer Sent'
            : direction === 'in'
                ? 'P2P Transfer Received'
                : 'P2P Transfer',
        description: [other && `${direction === 'out' ? 'To' : 'From'}: ${other}`, row.metadata_json?.note]
            .filter(Boolean)
            .join(' · ') || row.description || row.reference_id || 'P2P wallet transfer',
    }
}

function statusClass(status) {
    const normalized = String(status || '').toLowerCase()
    if (['failed', 'rejected', 'cancelled', 'reversed'].includes(normalized)) return 'text-red-400'
    if (['pending', 'processing'].includes(normalized)) return 'text-amber-300'
    return 'text-emerald-400'
}

async function loadRows(tab) {
    if (tab === 'p2p') {
        const response = await api.get('/api/wallet/transactions?type=adjustment&kind=p2p_transfer&limit=100', { cache: 'no-store' })
        return rowsOf(response).map(normalizeP2p)
    }
    const [deposits, withdrawals] = await Promise.all([
        api.get('/api/wallet/deposits?limit=100', { cache: 'no-store' }),
        api.get('/api/wallet/withdrawals?limit=100', { cache: 'no-store' }),
    ])
    return [...rowsOf(deposits).map(normalizeDeposit), ...rowsOf(withdrawals).map(normalizeWithdrawal)]
}

export default function P2pLog() {
    const [tab, setTab] = useState('payments')
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        setRows([])
        loadRows(tab)
            .then((items) => active && setRows(items.sort(
                (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
            )))
            .catch((requestError) => active && setError(requestError.message || 'Unable to load transactions.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [tab])

    return <>
        <PageTitle title="Payment Transfer Log" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        <div className="grid grid-cols-2 bg-account-header" role="tablist" aria-label="Transaction log tabs">
            {[['payments', 'Payment Transfer Log'], ['p2p', 'P2p Log']].map(([value, label]) => <button role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)} className={`h-10 border-b-2 py-2.5 text-sm font-medium ${tab === value ? 'border-white text-white' : 'border-transparent text-white/70 hover:text-white'}`}>{label}</button>)}
        </div>
        <div className="flex flex-col gap-y-3 px-2 py-4 text-white">
            {loading && <Loader />}
            {!loading && error && <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
            {!loading && !error && rows.length === 0 && (
                <div className="mx-auto mt-18 flex w-full max-w-36 flex-col items-center justify-center gap-y-2 rounded-xl bg-surface p-4">
                    <NotAvailable />
                    <span className="text-base text-ink-soft">No Data</span>
                </div>
            )}
            {!loading && !error && rows.map((row) => {
                const amount = Number(row.amount || 0)
                return (
                    <article key={row.key} className="rounded-xl border border-line bg-surface p-4 text-sm">
                        <div className="flex items-start justify-between gap-3">
                            <strong>{row.title || 'Payment'}</strong>
                            <span className={`capitalize ${statusClass(row.status)}`}>{row.status || 'completed'}</span>
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">{row.description || row.reference_id || 'Wallet transaction'}</p>
                        <div className="mt-3 flex items-end justify-between gap-3 text-xs text-ink-soft">
                            <span>{row.created_at ? new Date(row.created_at).toLocaleString('en-GB') : ''}</span>
                            <strong className={amount >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {amount < 0 ? '-' : '+'}{DISPLAY_CURRENCY} {Math.abs(amount).toFixed(2)}
                            </strong>
                        </div>
                    </article>
                )
            })}
        </div>
    </>
}
