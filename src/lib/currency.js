// The one currency every site shows: BDT (static, no per-site setting).
export const DISPLAY_CURRENCY = 'BDT'

/** The site's currency code (always BDT). */
export const useDisplayCurrency = () => DISPLAY_CURRENCY

export const formatMoney = (value) => (
    `${DISPLAY_CURRENCY} ${Number(value || 0).toFixed(2)}`
)
