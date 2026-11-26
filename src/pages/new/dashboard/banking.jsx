import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import useSiteFeatures from '@/hooks/use-site-features'
import { useFundsConfig } from '@/components/dashboard/banking/funds'
import { Notice } from '@/components/dashboard/banking/ui'
import DepositTab from '@/components/dashboard/banking/deposit-tab'
import WithdrawTab from '@/components/dashboard/banking/withdraw-tab'
import P2pTab from '@/components/dashboard/banking/p2p-tab'

// Unified Banking page: Deposit / Withdraw / P2P share one screen with a tab
// bar. The active tab comes from the route so /dashboard/deposit, /withdraw and
// /p2p each deep-link into the right tab and the back button keeps working.
const TAB_FROM_PATH = (pathname) => {
  if (pathname.endsWith('/withdraw')) return 'withdraw'
  if (pathname.endsWith('/p2p')) return 'p2p'
  return 'deposit'
}

export default function Banking() {
  const navigate = useNavigate()
  const location = useLocation()
  const features = useSiteFeatures()
  const { config, error, loading, reload } = useFundsConfig()

  const tab = TAB_FROM_PATH(location.pathname)

  useEffect(() => {
    document.body.classList.add('dark-banking-backdrop')
    return () => document.body.classList.remove('dark-banking-backdrop')
  }, [])

  const tabs = [
    { key: 'deposit', label: 'Deposit', path: '/dashboard/deposit' },
    { key: 'withdraw', label: 'Withdraw', path: '/dashboard/withdraw' },
    ...(features.p2p ? [{ key: 'p2p', label: 'P2P', path: '/dashboard/p2p' }] : []),
  ]

  const onFundsChanged = () => {
    reload()
    window.dispatchEvent(new CustomEvent('velki:balance-changed'))
  }

  return (
    <div className="banking-page flex min-h-dvh flex-col bg-page text-white">
      <header className="sticky top-0 z-30 bg-account-header">
        <div className="relative flex h-[49px] items-center justify-center px-4">
          <h1 className="font-poppins text-[16px] font-bold leading-7 text-white">Banking</h1>
          <button
            type="button"
            aria-label="Close banking"
            onClick={() => navigate('/profile')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
          >
            <X className="size-7" />
          </button>
        </div>
        <nav className="flex" aria-label="Banking sections">
          {tabs.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex-1 py-3 font-poppins text-[14px] font-semibold transition-colors ${
                  active ? 'text-white' : 'text-white/60'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-white" />
                )}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {tab === 'p2p' ? (
          <P2pTab onSubmitted={reload} />
        ) : loading ? (
          <p className="py-16 text-center text-[13px] text-ink-muted">Loading banking options…</p>
        ) : error ? (
          <div className="px-2.5 pt-6">
            <Notice>{error}</Notice>
          </div>
        ) : tab === 'withdraw' ? (
          <WithdrawTab config={config} onSubmitted={onFundsChanged} />
        ) : (
          <DepositTab config={config} onSubmitted={onFundsChanged} />
        )}
      </main>
    </div>
  )
}
