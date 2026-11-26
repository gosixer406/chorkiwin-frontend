import { useEffect } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

// Lightweight top toast for the Deposit / Withdraw tabs — shows the submit
// success / error message at the top of the screen and auto-dismisses.
export function BankingToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-80 flex justify-center px-3 pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <div
        key={toast.id}
        role={ok ? 'status' : 'alert'}
        className={`pointer-events-auto flex w-full max-w-[420px] animate-[bankToastIn_0.25s_ease] items-start gap-2 rounded-md border px-3 py-2.5 text-[13px] font-medium shadow-lg ${
          ok ? 'border-[#16833B]/60 bg-[#0f2a1b] text-[#5BD69E]' : 'border-[#772C2C] bg-[#2a1313] text-[#FF7A84]'
        }`}
      >
        {ok ? <CheckCircle2 className="mt-px size-4 shrink-0" /> : <XCircle className="mt-px size-4 shrink-0" />}
        <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>
      <style>{`@keyframes bankToastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
