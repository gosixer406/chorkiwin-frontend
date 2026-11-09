import { useSelector } from 'react-redux'
import PageTitle from '@/components/dashboard/page-title'

const amount = (value) => Number(value || 0).toFixed(2)

export default function BalanceOverview() {
    const wallet = useSelector((state) => state.auth.user?.wallet) || {}
    const currency = 'USD'
    const rows = [
        ['Main Balance', wallet.available ?? wallet.main_balance ?? wallet.balance],
        ['Bonus Balance', wallet.bonus_balance],
        ['Exposure', wallet.exposure],
        ['Cash Back Balance', wallet.cashback_balance ?? wallet.cash_back_balance],
    ]

    return <>
        <PageTitle title="Balance Overview" titleClass="font-poppins text-[15px] font-bold tracking-tight" className="min-h-[51px]! bg-account-header px-3! text-white" />
        <section className="space-y-2 px-[13px] py-3" aria-label="Balance overview">
            <div className="rounded-md bg-linear-to-r from-(--menu-banner-from) via-(--menu-banner-via) to-(--menu-banner-to) p-4 text-white">
                <p className="text-xs font-medium text-(--menu-banner-sub)">Total Balance</p>
                <strong className="mt-1 block text-2xl">{currency} {amount(wallet.available ?? wallet.main_balance ?? wallet.balance)}</strong>
            </div>
            <div className="overflow-hidden rounded-md border border-line bg-surface">
                {rows.map(([label, value]) => <div key={label} className="flex min-h-12 items-center justify-between border-b border-line px-4 last:border-b-0">
                    <span className="text-sm text-ink-soft">{label}</span>
                    <strong className="text-sm text-white">{currency} {amount(value)}</strong>
                </div>)}
            </div>
        </section>
    </>
}
