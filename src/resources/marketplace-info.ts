import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'

export function registerMarketplaceInfoResource(
  server: McpServer,
  client: Merka2aClient,
): void {
  server.resource(
    'marketplace-info',
    'merka2a://marketplace-info',
    {
      description: 'Overview of the Merka2a Agent Exchange: what it is, how it works, available categories',
      mimeType: 'text/markdown',
    },
    async () => {
      let categoriesSection = ''
      try {
        const cats = await client.getCategories()
        const catList = cats.categories ?? cats
        if (Array.isArray(catList)) {
          categoriesSection = '\n## Available Categories\n\n' +
            catList.map((c: any) =>
              typeof c === 'string'
                ? `- \`${c}\``
                : `- **${c.prefix}**: ${c.subcategories?.map((s: string) => `\`${s}\``).join(', ') ?? ''}`
            ).join('\n')
        }
      } catch {
        categoriesSection = '\n## Available Categories\n\n- `compute.gpu`, `compute.cluster`, `compute.inference`'
      }

      return {
        contents: [{
          uri: 'merka2a://marketplace-info',
          text: MARKETPLACE_INFO + categoriesSection,
          mimeType: 'text/markdown',
        }],
      }
    },
  )
}

const MARKETPLACE_INFO = `# Merka2a — Agent-Native Compute Exchange

Merka2a is a neutral broker for AI commerce agents. It aggregates GPU/compute capacity from providers (e.g. RunPod, Lambda, Vast) and lets an AI agent discover and buy it through one structured API. Merka2a is not the seller — prices are the provider's listed (fixed) retail rate.

## How to buy compute (the whole path)

1. **Search** — \`search_products\` with a category (e.g. \`compute.gpu\`) and optional filters (budget, GPU model, VRAM, GPU count, region). Prices are per GPU-hour.
2. **Order** — \`place_order\` with the offer ID, quantity, and \`duration_hours\` for a time-based rental. Compute is provisioned, not shipped, so no address is needed. The order is recorded at the listed price (status \`created\`).
3. **Pay** — \`pay_order\` settles agent-natively via **x402 (USDC on Base)** — no human browser. With a funded buyer key (\`X402_BUYER_PRIVATE_KEY\`) it signs and settles end-to-end; otherwise it returns the payment terms for a wallet.
4. **Provision** — once payment is captured, the reserved capacity **provisions automatically**. Poll \`check_order\` until the status is \`provisioned\`, then read the access details.

## Key Concepts

- **Offers** are aggregated from providers and tied to compute products. Each offer has a per-hour price and an inventory count. Prices are fixed at provider retail — there is no negotiation.
- **Products** carry structured GPU attributes: \`gpuModel\`, \`vramGb\`, \`gpuCount\`, \`interconnect\`, \`manufacturer\`, \`region\`.
- **Payment** is x402 / USDC on Base. Orders are priced and paid in USD.
- **Money** is in major currency units in all tool inputs/outputs (e.g. 2.50 means USD 2.50 per GPU-hour).

## Supported Workflows

- **Single reservation**: search → order (with duration) → pay (x402) → provisioned
- **Bulk procurement**: search across regions/models → place multiple orders → pay each
- **Price comparison**: search with different parameters to compare offerings across providers
- **Refunds & disputes**: cancel orders, request refunds, open disputes if needed
`
