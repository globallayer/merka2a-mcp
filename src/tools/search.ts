import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { buildBuyerIntent } from '../util/intent-builder.js'
import { formatSearchResult, textContent } from '../util/format.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerSearchTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'search_products',
    'Search the Merka2a agent-native compute exchange for GPU/compute offers. Provide a category and optional filters like budget, GPU model, VRAM, region. All prices are in the main currency unit (e.g. 2.50 means USD 2.50 per GPU-hour).',
    {
      query: z.string().max(500).optional()
        .describe('Free-text search query, e.g. "8x H100 80GB for training"'),
      category: z.string().optional()
        .describe('Compute category, e.g. "compute.gpu", "compute.cluster", "compute.inference". If omitted, inferred from query.'),
      max_budget: z.number().positive().optional()
        .describe('Maximum budget in major currency units'),
      currency: z.string().length(3).default('USD')
        .describe('ISO 4217 currency code (default: USD)'),
      budget_preference: z.enum(['cheapest', 'best-value', 'premium']).optional()
        .describe('Budget preference'),
      quantity: z.number().int().positive().default(1)
        .describe('Number of units needed (default: 1)'),
      condition: z.array(z.enum(['new', 'refurbished', 'used-like-new', 'used-good', 'used-fair'])).optional()
        .describe('Acceptable product conditions'),
      brand: z.union([z.string(), z.array(z.string())]).optional()
        .describe('Manufacturer filter, e.g. "NVIDIA", "AMD"'),
      gpu_model: z.union([z.string(), z.array(z.string())]).optional()
        .describe('GPU model filter, e.g. "H100", ["H100","A100"]'),
      min_vram_gb: z.number().positive().optional()
        .describe('Minimum VRAM per GPU in GB, e.g. 80'),
      min_gpu_count: z.number().int().positive().optional()
        .describe('Minimum GPUs per instance, e.g. 8'),
      region: z.string().optional()
        .describe('Deployment region, e.g. "eu-west", "us-east"'),
      max_price_per_hour: z.number().positive().optional()
        .describe('Maximum price per GPU-hour in major currency units'),
      max_delivery_days: z.number().int().positive().optional()
        .describe('Maximum acceptable delivery time in days'),
      destination_country: z.string().length(2).optional()
        .describe('ISO 3166-1 alpha-2 destination country code, e.g. "GB", "US"'),
      negotiable_only: z.boolean().default(false)
        .describe('If true, only return offers open to price negotiation'),
      limit: z.number().int().min(1).max(50).default(10)
        .describe('Max results to return (default: 10)'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const intent = buildBuyerIntent(input)
        const result = await client.searchIntent(intent as any, { limit: input.limit ?? 10 })

        if (!result.results?.length) {
          return textContent(
            'No offers found matching your criteria. Try broadening your search:\n' +
            '- Increase your budget or per-hour cap\n' +
            '- Relax the VRAM or GPU-count minimums\n' +
            '- Try a broader category (e.g. "compute.gpu" instead of a specific model)\n' +
            '- Remove the GPU model or region filters'
          )
        }

        const header = `Found ${result.results.length} product${result.results.length > 1 ? 's' : ''}${result.pagination?.hasMore ? ' (more available)' : ''}:\n\n`
        const formatted = result.results
          .map((r: any, i: number) => formatSearchResult(r, i))
          .join('\n\n---\n\n')

        const footer = '\n\n---\n\n**Next steps:**\n' +
          '- Buy at the listed price: `place_order` with the Offer ID (add `duration_hours` for a time-based GPU rental)\n' +
          '- Then settle agent-natively: `pay_order` (x402 / USDC on Base). Capacity provisions automatically once paid.'

        return textContent(header + formatted + footer)
      }, 'Product Search')
    },
  )

  server.tool(
    'browse_categories',
    'List all available product categories in the Merka2a marketplace.',
    {},
    async () => {
      return withErrorHandling(async () => {
        const result = await client.getCategories()
        const categories = result.categories ?? result
        const lines = ['# Available Product Categories\n']
        if (Array.isArray(categories)) {
          for (const cat of categories) {
            if (typeof cat === 'string') {
              lines.push(`- \`${cat}\``)
            } else if (cat.prefix) {
              const subs = cat.subcategories?.map((s: string) => `\`${s}\``).join(', ')
              lines.push(`- **${cat.prefix}**${subs ? ': ' + subs : ''}`)
            }
          }
        }
        lines.push('\n**Tip:** Use these category values in the `search_products` tool.')
        return textContent(lines.join('\n'))
      }, 'Browse Categories')
    },
  )
}
