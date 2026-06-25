import { toMinorUnits } from './money.js'

export interface SearchInput {
  query?: string
  category?: string
  max_budget?: number
  currency?: string
  budget_preference?: 'cheapest' | 'best-value' | 'premium'
  quantity?: number
  condition?: string[]
  brand?: string | string[]
  min_ram_gb?: number
  min_storage_gb?: number
  max_delivery_days?: number
  destination_country?: string
  negotiable_only?: boolean
}

export function buildBuyerIntent(input: SearchInput): Record<string, unknown> {
  const currency = input.currency ?? 'GBP'

  const intent: Record<string, unknown> = {
    category: input.category ?? inferCategory(input.query),
    quantity: input.quantity ?? 1,
  }

  if (input.query) {
    intent.query = input.query.slice(0, 500)
  }

  if (input.max_budget != null) {
    const budget: Record<string, unknown> = {
      max: { amount: toMinorUnits(input.max_budget, currency), currency },
    }
    if (input.budget_preference) {
      budget.preference = input.budget_preference
    }
    intent.budget = budget
  }

  if (input.condition?.length) {
    intent.condition = input.condition
  }

  // Hardware filters map to structured electronicsConstraints, which the matching
  // layer honours with the right semantics: manufacturer is matched exactly against
  // the stored `manufacturer` string, and minRamGb/minStorageGb are numeric `>=`
  // guards against `ramGb`/`storageGb`. (The previous shape — a `brand` array plus
  // `minRamGb` inside requiredAttributes' `@>` containment — matched no product and
  // always returned zero rows.)
  const electronicsConstraints: Record<string, unknown> = {}
  if (input.brand) {
    electronicsConstraints.manufacturer = Array.isArray(input.brand) && input.brand.length === 1
      ? input.brand[0]
      : input.brand
  }
  if (input.min_ram_gb != null) electronicsConstraints.minRamGb = input.min_ram_gb
  if (input.min_storage_gb != null) electronicsConstraints.minStorageGb = input.min_storage_gb
  if (Object.keys(electronicsConstraints).length > 0) {
    intent.electronicsConstraints = electronicsConstraints
  }

  if (input.max_delivery_days != null || input.destination_country) {
    intent.delivery = {
      destination: { country: input.destination_country ?? 'GB' },
      ...(input.max_delivery_days != null ? { maxDays: input.max_delivery_days } : {}),
    }
  }

  if (input.negotiable_only) {
    intent.negotiation = { willing: true }
  }

  return intent
}

function inferCategory(query?: string): string {
  if (!query) return 'electronics'
  const q = query.toLowerCase()
  if (q.includes('laptop') || q.includes('notebook')) return 'electronics.laptops'
  if (q.includes('monitor') || q.includes('display') || q.includes('screen')) return 'electronics.monitors'
  if (q.includes('phone') || q.includes('smartphone') || q.includes('mobile')) return 'electronics.smartphones'
  if (q.includes('keyboard')) return 'electronics.keyboards'
  if (q.includes('mouse') || q.includes('mice')) return 'electronics.mice'
  if (q.includes('headphone') || q.includes('headset') || q.includes('earphone')) return 'electronics.headphones'
  if (q.includes('tablet') || q.includes('ipad')) return 'electronics.tablets'
  if (q.includes('camera') || q.includes('webcam')) return 'electronics.cameras'
  if (q.includes('tv') || q.includes('television')) return 'electronics.televisions'
  if (q.includes('speaker')) return 'electronics.speakers'
  if (q.includes('printer')) return 'electronics.printers'
  if (q.includes('router') || q.includes('networking')) return 'electronics.networking'
  if (q.includes('storage') || q.includes('ssd') || q.includes('hard drive') || q.includes('hdd')) return 'electronics.storage'
  if (q.includes('gpu') || q.includes('graphics card')) return 'electronics.gpus'
  if (q.includes('cpu') || q.includes('processor')) return 'electronics.cpus'
  if (q.includes('ram') || q.includes('memory')) return 'electronics.memory'
  return 'electronics'
}
