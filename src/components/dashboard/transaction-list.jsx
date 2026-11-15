import Loader from '@/components/loader'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import NotAvailable from '@/utilities/icons/not-available'

function normalizeP2p(row) {
    const direction = row.metadata_json?.direction
    return {
        ...row,
        type: 'p2p',
        title: direction === 'out' ? 'P2P Transfer Sent' : direction === 'in' ? 'P2P Transfer Received' : 'P2P Transfer',
        description: row.description || row.reference_id || 'P2P wallet transfer',
    }
}

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
        type: 'deposit',
        title: 'Deposit',
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
        type: 'withdrawal',
        title: 'Withdrawal',
        amount: -Math.abs(Number(row.amount ?? 0)),
        description: detail,
    }
}

function statusClass(status) {
    const normalized = String(status || '').toLowerCase()
    if (['failed', 'rejected', 'cancelled', 'reversed'].includes(normalized)) return 'text-[#C72D36]'
    if (['pending', 'processing'].includes(normalized)) return 'text-[#B27600]'
    return 'text-[#16883E]'
}

export default function TransactionList({ p2pOnly = false }) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        const p2pRequest = api.get('/api/wallet/transactions?type=adjustment&kind=p2p_transfer&limit=100')
        const request = p2pOnly
            ? p2pRequest.then((response) => (response.data || []).map(normalizeP2p))
            : Promise.all([
                api.get('/api/wallet/deposits?limit=100'),
                api.get('/api/wallet/withdrawals?limit=100'),
                p2pRequest,
            ]).then(([deposits, withdrawals, p2p]) => [
                ...(deposits.data || []).map(normalizeDeposit),
                ...(withdrawals.data || []).map(normalizeWithdrawal),
                ...(p2p.data || []).map(normalizeP2p),
            ])

        request
            .then((items) => active && setRows(items.sort(
                (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
            )))
            .catch((requestError) => active && setError(requestError.message || 'Unable to load transactions.'))
            .finally(() => active && setLoading(false))
        return () => { active = false }
    }, [p2pOnly])

    if (loading) return <Loader />
    if (error) return <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
    if (!rows.length) return (
        <div className="mx-auto mt-18 flex w-full max-w-36 flex-col items-center justify-center gap-y-2 rounded-xl bg-white p-4">
            <NotAvailable />
            <span className="text-base text-[#4F6173]">No Data</span>
        </div>
    )

    return <div className="flex flex-col gap-y-3">
        {rows.map((row) => {
            const amount = Number(row.amount || 0)
            return (
            <article key={row.id} className="rounded-xl bg-white p-4 text-sm shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <strong className="text-black">{row.title || 'Payment'}</strong>
                    <span className={`capitalize ${statusClass(row.status)}`}>{row.status || 'completed'}</span>
                </div>
                <p className="mt-1 text-xs text-[#647D8D]">{row.description || row.reference_id || 'Wallet transaction'}</p>
                <div className="mt-3 flex items-end justify-between gap-3 text-xs text-[#647D8D]">
                    <span>{row.created_at ? new Date(row.created_at).toLocaleString('en-GB') : ''}</span>
                    <strong className={amount >= 0 ? 'text-[#16883E]' : 'text-[#C72D36]'}>
                        {amount < 0 ? '-' : ''}BDT {Math.abs(amount).toFixed(2)}
                    </strong>
                </div>
            </article>
            )
        })}
    </div>
}
