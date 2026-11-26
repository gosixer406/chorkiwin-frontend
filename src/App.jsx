import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { createBrowserRouter, Navigate, RouterProvider, useLocation, useParams } from 'react-router-dom'

import Error from './pages/error'
import AuthBootstrap from './components/auth-bootstrap';
import ProtectedRoute from './components/protected-route';
import GameSession from './components/game-session';
import ExchangeReturn from './components/exchange-return';
import OpenGame from './pages/open-game';
import SingleTabGuard from './components/single-tab-guard';
import { SplashCloser, StartupFallback } from './components/preloader';

const loadNewIndex = () => import('./layout/new/index')
const loadNewHome = () => import('./pages/new/home')
const NewIndex = lazy(loadNewIndex)
const NewAuth = lazy(() => import('./layout/new/auth/index'))
const NewDashboardIndex = lazy(() => import('./layout/new/dashboard/index'))
const NewPopular = lazy(loadNewHome)

// Most visits land on the home page: download its code while the startup
// loader waits on the backend instead of after the loader closes.
if (window.location.pathname === '/' || /^\/(popular|sports|casino|slots|table|crash|fishing|arcade|lottery)$/.test(window.location.pathname)) {
  loadNewIndex()
  loadNewHome()
}
const NewLogin = lazy(() => import('./pages/new/auth/login'))
const Profile = lazy(() => import('./pages/new/profile'))
const UplineWhatsapp = lazy(() => import('./pages/new/upline-whatsapp'))
const AgentList = lazy(() => import('./pages/new/agent-list'))
const P2p = lazy(() => import('./pages/new/dashboard/p2p'))
const Transaction = lazy(() => import('./pages/new/dashboard/transaction'))
const P2pLog = lazy(() => import('./pages/new/dashboard/p2p-log'))
const BetHistory = lazy(() => import('./pages/new/dashboard/bet-history'))
const NewProfitLoss = lazy(() => import('./pages/new/dashboard/profit-loss'))
const NewAccountStatement = lazy(() => import('./pages/new/dashboard/account-statement'))
const NewLifetimeProfitLoss = lazy(() => import('./pages/new/dashboard/lifetime-profit-loss'))
const NewTurnover = lazy(() => import('./pages/new/dashboard/turnover'))
const NewBonus = lazy(() => import('./pages/new/dashboard/bonus'))
const VipClub = lazy(() => import('./pages/new/dashboard/vip-club'))
const NewReferral = lazy(() => import('./pages/new/dashboard/referral'))
const NewCurrentBets = lazy(() => import('./pages/new/dashboard/current-bets'))
const Settings = lazy(() => import('./pages/new/dashboard/settings'))
const Promotions = lazy(() => import('./pages/new/promotions'))
const NewStaticPage = lazy(() => import('./pages/new/static'))
const BalanceOverview = lazy(() => import('./pages/new/dashboard/balance-overview'))
const Cashback = lazy(() => import('./pages/new/dashboard/cashback'))
const LossBack = lazy(() => import('./pages/new/dashboard/loss-back'))
const ActivityLog = lazy(() => import('./pages/new/dashboard/activity-log'))

// The light (legacy) experience has been retired. Its URLs stay valid and land on
// the matching dark page so old bookmarks, shared links and returnTo values work.
const darkDashboardPaths = {
  balance: 'balance-overview',
  turnover: 'turnover',
  referral: 'referral',
  'cash-back': 'cashback',
  'current-bets': 'current-bets',
  'bet-history': 'bet-history',
  'bonus-records': 'bonus',
  'profit-loss': 'profit-loss',
  'account-statement': 'account-statement',
  'active-log': 'activity-log',
  'lifetime-profit-loss': 'lifetime-profit-loss',
  settings: 'settings',
}

const darkCasinoCategories = {
  hot: 'popular', popular: 'popular', live: 'casino', table: 'table', slot: 'slots', fishing: 'fishing', egame: 'arcade',
}

function withSearch(path, search) {
  if (!search) return path
  return `${path}${path.includes('?') ? '&' : '?'}${search.replace(/^\?/, '')}`
}

function DarkRedirect({ to }) {
  const { search } = useLocation()
  const params = useParams()
  const target = typeof to === 'function' ? to(params) : to
  return <Navigate to={withSearch(target, search)} replace />
}

// Deposit and withdraw pages are gone: their old URLs land on P2P like any other unknown page.
function darkDashboardPath({ page }) {
  if (page === 'upline-whatsapp') return '/upline-whatsapp'
  if (page === 'profile') return '/profile'
  return `/dashboard/${darkDashboardPaths[page] || 'p2p'}`
}

function stripNewVersionPrefix(params) {
  const rest = (params['*'] || '').replace(/^home\/?$/, '')
  return `/${rest}`
}

function darkCasinoPath({ category }) {
  return `/${darkCasinoCategories[category] || 'popular'}`
}

export default function App() {
  const [routerKey, setRouterKey] = useState(0)

  useEffect(() => {
    const hideLaunchLoader = () => {
      document.querySelectorAll('button [data-launch-loader]').forEach((spinner) => {
        const overlay = spinner.closest('[role="status"]')
        if (overlay) overlay.style.display = 'none'
      })
    }

    const hideLeavingLaunchLoader = () => {
      // This marker is written only after the launch response and balance
      // snapshot are ready, immediately before navigation to 9Wickets.
      if (localStorage.getItem('velki_exchange_active') === '1') {
        hideLaunchLoader()
      }
    }

    const hideWhenDocumentBecomesHidden = () => {
      if (document.visibilityState === 'hidden') hideLeavingLaunchLoader()
    }

    const resetRestoredPage = (event) => {
      // Leave the outbound route untouched so 9Wickets can receive the account
      // balance, then synchronously remove the stale card loader on return.
      if (event.persisted) {
        flushSync(() => setRouterKey((key) => key + 1))
      }
    }

    window.addEventListener('pageswap', hideLeavingLaunchLoader)
    window.addEventListener('pagereveal', hideLaunchLoader)
    window.addEventListener('pagehide', hideLeavingLaunchLoader)
    window.addEventListener('pageshow', resetRestoredPage)
    document.addEventListener('visibilitychange', hideWhenDocumentBecomesHidden)
    return () => {
      window.removeEventListener('pageswap', hideLeavingLaunchLoader)
      window.removeEventListener('pagereveal', hideLaunchLoader)
      window.removeEventListener('pagehide', hideLeavingLaunchLoader)
      window.removeEventListener('pageshow', resetRestoredPage)
      document.removeEventListener('visibilitychange', hideWhenDocumentBecomesHidden)
    }
  }, [])

  // Built once per routerKey (a bfcache restore bumps it), not on every render.
  const router = useMemo(() => createBrowserRouter([
    // Retired URLs (light mode and the old /new-version prefix) redirect to the
    // current pages so old bookmarks, shared links and returnTo values work.
    { path: '/new-version/*', element: <DarkRedirect to={stripNewVersionPrefix} />, errorElement: <Error /> },
    { path: '/home', element: <DarkRedirect to="/" />, errorElement: <Error /> },
    { path: '/legacy', element: <Navigate to="/" replace />, errorElement: <Error /> },
    { path: '/legacy/promotions', element: <DarkRedirect to="/promotions" />, errorElement: <Error /> },
    { path: '/legacy/promotions/:promotionId', element: <DarkRedirect to={({ promotionId }) => `/promotions/${promotionId}`} />, errorElement: <Error /> },
    { path: '/9wickets', element: <Navigate to="/sports" replace />, errorElement: <Error /> },
    { path: '/dashboard/:page', element: <DarkRedirect to={darkDashboardPath} />, errorElement: <Error /> },
    { path: '/casino/:category', element: <DarkRedirect to={darkCasinoPath} />, errorElement: <Error /> },
    { path: '/games/sports', element: <Navigate to="/sports" replace />, errorElement: <Error /> },
    { path: '/games/casino', element: <Navigate to="/popular" replace />, errorElement: <Error /> },
    { path: '/games/casino/:category', element: <DarkRedirect to={darkCasinoPath} />, errorElement: <Error /> },

    {
      path: '/',
      element: <NewIndex />,
      errorElement: <Error />,
      children: [
        {
          index: true,
          element: <NewPopular />
        },
        {
          // Home tabs: /sports, /casino, /slots, ...
          path: ':category',
          element: <NewPopular />
        },
        {
          path: 'profile',
          element: <ProtectedRoute><Profile /></ProtectedRoute>
        },
        {
          path: 'upline-whatsapp',
          element: <ProtectedRoute><UplineWhatsapp /></ProtectedRoute>
        },
        {
          path: 'agent-list',
          element: <AgentList />
        },
        {
          path: 'promotions',
          element: <Promotions />,
        },
        {
          path: 'promotions/:promotionId',
          element: <Promotions />,
        },
      ]
    },
    {
      element: <NewAuth />,
      errorElement: <Error />,
      children: [
        {
          path: '/login',
          element: <NewLogin key="login" />
        },
        {
          path: '/signup',
          element: <NewLogin key="signup" />
        },
      ]
    },
    // Old /auth/* links: keep any ?returnTo= so the login page can pick it up.
    { path: '/auth', element: <DarkRedirect to="/login" />, errorElement: <Error /> },
    { path: '/auth/login', element: <DarkRedirect to="/login" />, errorElement: <Error /> },
    { path: '/auth/signup', element: <DarkRedirect to="/signup" />, errorElement: <Error /> },
    {
      path: '/dashboard',
      element: <ProtectedRoute><NewDashboardIndex /></ProtectedRoute>,
      errorElement: <Error />,
      children: [
        {
          index: true,
          element: <Navigate to="p2p" replace />
        },
        {
          path: 'p2p',
          element: <P2p />
        },
        {
          path: 'transaction',
          element: <Transaction />
        },
        {
          path: 'p2p-log',
          element: <P2pLog />
        },
        {
          path: 'bet-history',
          element: <BetHistory />
        },
        {
          path: 'current-bets',
          element: <NewCurrentBets />
        },
        {
          path: 'profit-loss',
          element: <NewProfitLoss />
        },
        {
          path: 'account-statement',
          element: <NewAccountStatement />
        },
        {
          path: 'activity-log',
          element: <ActivityLog />
        },
        {
          path: 'lifetime-profit-loss',
          element: <NewLifetimeProfitLoss />
        },
        {
          path: 'turnover',
          element: <NewTurnover />
        },
        {
          path: 'vip-club',
          element: <VipClub />
        },
        {
          path: 'bonus',
          element: <NewBonus />
        },
        {
          path: 'referral',
          element: <NewReferral />
        },
        {
          path: 'settings',
          element: <Settings />
        },
        {
          path: 'balance-overview',
          element: <BalanceOverview />
        },
        {
          path: 'cashback',
          element: <Cashback />
        },
        {
          path: 'loss-back',
          element: <LossBack />
        },
      ]
    },
    {
      path: '/static/:document',
      element: <NewStaticPage />,
      errorElement: <Error />,
    },
    // Anything else (e.g. /foo/bar) goes home instead of a blank 404.
    { path: '*', element: <Navigate to="/" replace /> },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt on purpose when routerKey changes
  ]), [routerKey])
  if (window.location.pathname === '/9w-return') return <ExchangeReturn />
  // The casino game tab: outside the shell so it neither takes over the site
  // tab (SingleTabGuard) nor runs the site's startup.
  if (window.location.pathname.startsWith('/open-game/')) return <OpenGame />
  return (
    <SingleTabGuard>
      <div className="relative z-1 mx-auto min-h-dvh w-full max-w-[480px] overflow-x-hidden">
        <AuthBootstrap>
          <Suspense fallback={<StartupFallback />}>
            <RouterProvider key={routerKey} router={router} />
            <SplashCloser />
            <GameSession />
          </Suspense>
        </AuthBootstrap>
      </div>
    </SingleTabGuard>
  )
}
