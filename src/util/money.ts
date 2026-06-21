export function toMinorUnits(amount: number, _currency: string): number {
  return Math.round(amount * 100)
}

export function toMajorUnits(amount: number, _currency: string): number {
  return amount / 100
}

const SYMBOLS: Record<string, string> = {
  GBP: '\u00A3',
  USD: '$',
  EUR: '\u20AC',
}

export function formatMoney(amountMinor: number, currency: string): string {
  const major = toMajorUnits(amountMinor, currency)
  const symbol = SYMBOLS[currency] ?? `${currency} `
  return `${symbol}${major.toFixed(2)}`
}
