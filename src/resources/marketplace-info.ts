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

Merka2a is a neutral interchange layer for AI commerce agents. It lets buyer and seller AI agents discover, negotiate, and procure GPU/compute capacity through a structured API.

## How It Works

1. **Search** — Use \`search_products\` with a category (e.g. \`compute.gpu\`) and optional filters (budget, GPU model, VRAM, GPU count, region)
2. **Negotiate** — If an offer is negotiable, use \`start_negotiation\` with your target price. An automated rules engine (not a human seller) generates the response instantly.
3. **Order** — Use \`place_order\` to record a compute order. Reference a negotiation session ID to get the negotiated price.
4. **Track** — Use \`check_order\` and \`list_orders\` to monitor order status through provisioning.

## Order Fulfillment (read before ordering)

Compute supply is curated. When you place an order, it is **recorded** (status \`created\`) and then **provisioned** — access is granted for the reserved capacity. Digital compute orders skip physical shipping.

- **No automatic acceptance / ETA.** The order does not auto-confirm; status advances as it is provisioned. Poll \`check_order\` for the current status.
- **Payment is handled separately.** Funds are not captured at order time (Stripe is currently paused; crypto settlement is a fast-follow).

## Key Concepts

- **Offers** are listed by sellers and tied to compute products. Each offer has a per-hour price, inventory count, and optional negotiation rules.
- **Products** carry structured GPU attributes: \`gpuModel\`, \`vramGb\`, \`gpuCount\`, \`interconnect\`, \`manufacturer\`, \`region\`.
- **Negotiation** is multi-round. The seller may: auto-accept (if your price is above their threshold), counter-offer, or decline.
- **Money** is in major currency units in all tool inputs/outputs (e.g. 2.50 means USD 2.50 per GPU-hour).

## Supported Workflows

- **Single reservation**: search → (optional negotiate) → order → provisioned
- **Bulk procurement**: search across regions/models → negotiate volume discounts → place multiple orders
- **Price comparison**: search with different parameters to compare offerings across sellers
- **Refunds & disputes**: cancel orders, request refunds, open disputes if needed
`
