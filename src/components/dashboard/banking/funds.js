import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'

// Shared helpers for the tabbed Banking page (Deposit / Withdraw / P2P).
// Everything here speaks to the real gateway funds flow on the backend:
//   GET  /api/wallet/funds-config   — balance, limits, methods, verified phones
//   POST /api/wallet/deposit/request
//   POST /api/wallet/withdraw/request

export const CURRENCY = '৳'

export const formatAmount = (value) =>
  Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })

export const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Brand tints for the known mobile-money methods; anything else falls back to gold.
export const METHOD_BRAND = {
  bkash: { bg: '#E2136E', fg: '#ffffff' },
  nagad: { bg: '#EE4E2E', fg: '#ffffff' },
  rocket: { bg: '#8C3494', fg: '#ffffff' },
  upay: { bg: '#1BA39C', fg: '#ffffff' },
  usdt: { bg: '#26A17B', fg: '#ffffff' },
  bank: { bg: '#3B5BA9', fg: '#ffffff' },
}

export const brandFor = (code) =>
  METHOD_BRAND[String(code || '').toLowerCase()] || { bg: '#C9A227', fg: '#1a1a1a' }

export const CHANNEL_LABEL = {
  send_money: 'Send Money',
  cash_out: 'Cash Out',
  payment: 'Payment',
}

export const channelLabel = (key) =>
  CHANNEL_LABEL[key] ||
  String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

// Additive quick-amount chips. Each tap adds the value to the running amount.
export const DEPOSIT_PRESETS = [300, 500, 1000, 5000, 10000, 15000, 20000, 25000]
export const WITHDRAW_PRESETS = [500, 1000, 5000, 10000, 15000, 20000, 25000]

/** Load /api/wallet/funds-config and expose a reload handle. */
export function useFundsConfig() {
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/wallet/funds-config', { cache: 'no-store' })
      setConfig(res.data)
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Unable to load banking options.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is only set after the request resolves
    load()
  }, [load])

  return { config, error, loading, reload: load }
}
