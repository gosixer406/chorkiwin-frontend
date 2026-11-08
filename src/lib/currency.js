export const DISPLAY_CURRENCY = 'USD'

export const formatMoney = (value) => (
    `${DISPLAY_CURRENCY} ${Number(value || 0).toFixed(2)}`
)
