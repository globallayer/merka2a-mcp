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
  // Compute / GPU filters (active vertical)
  gpu_model?: string | string[]
  min_vram_gb?: number
  min_gpu_count?: number
  region?: string
  max_price_per_hour?: number
  // Electronics filters (shelved vertical — only wired when an electronics.* category is used)
  min_ram_gb?: number
  min_storage_gb?: number
  max_delivery_days?: number
  destination_country?: string
  negotiable_only?: boolean
}

export function buildBuyerIntent(input: SearchInput): Record<string, unknown> {
  const currency = input.currency ?? 'GBP'
  const category = input.category ?? inferCategory(input.query)

  const intent: Record<string, unknown> = {
    category,
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

  // Compute/GPU filters map to structured gpuComputeConstraints, whose keys the
  // matching layer looks up via `attributes ->> KEY`: gpuModel/manufacturer are
  // IN-list matches, minVramGb/minGpuCount are numeric `>=` guards, region is an
  // exact match, maxPricePerHour caps the hourly offer price.
  const gpuComputeConstraints: Record<string, unknown> = {}
  if (input.gpu_model) {
    gpuComputeConstraints.gpuModel = Array.isArray(input.gpu_model) && input.gpu_model.length === 1
      ? input.gpu_model[0]
      : input.gpu_model
  }
  if (input.min_vram_gb != null) gpuComputeConstraints.minVramGb = input.min_vram_gb
  if (input.min_gpu_count != null) gpuComputeConstraints.minGpuCount = input.min_gpu_count
  if (input.region) gpuComputeConstraints.region = input.region
  // brand acts as GPU manufacturer in the compute vertical
  if (input.brand && !isElectronicsCategory(category)) {
    gpuComputeConstraints.manufacturer = Array.isArray(input.brand) && input.brand.length === 1
      ? input.brand[0]
      : input.brand
  }
  if (input.max_price_per_hour != null) {
    gpuComputeConstraints.maxPricePerHour = {
      amount: toMinorUnits(input.max_price_per_hour, currency),
      currency,
    }
  }
  if (Object.keys(gpuComputeConstraints).length > 0) {
    intent.gpuComputeConstraints = gpuComputeConstraints
  }

  // Electronics filters map to electronicsConstraints — only wired for the
  // shelved electronics vertical, reached via an explicit electronics.* category.
  if (isElectronicsCategory(category)) {
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

function isElectronicsCategory(category: string): boolean {
  return category === 'electronics' || category.startsWith('electronics.')
}

/**
 * Infer a canonical `compute.*` category from a free-text query. Compute is the
 * active vertical, so an unrecognized query defaults to `compute.gpu`. Cluster
 * and inference sub-verticals are inferred from their keywords.
 */
function inferCategory(query?: string): string {
  if (!query) return 'compute.gpu'
  const q = query.toLowerCase()
  if (q.includes('cluster') || q.includes('training') || q.includes('multi-node')) return 'compute.cluster'
  if (q.includes('inference') || q.includes('serving') || q.includes('endpoint')) return 'compute.inference'
  return 'compute.gpu'
}
