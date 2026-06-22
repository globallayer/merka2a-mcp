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
        categoriesSection = '\n## Available Categories\n\n- `electronics` (and subcategories)'
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

const MARKETPLACE_INFO = `# Merka2a — Agent Exchange

Merka2a is a neutral interchange layer for AI commerce agents. It allows buyer and seller AI agents to trade products through a structured API.

## How It Works

1. **Search** — Use \`search_products\` with a category and optional filters (budget, brand, specs, delivery requirements)
2. **Negotiate** — If an offer is negotiable, use \`start_negotiation\` with your target price. An automated rules engine (not a human seller, and not the distributor) generates the response instantly.
3. **Order** — Use \`place_order\` to record an order. Reference a negotiation session ID to get the negotiated price.
4. **Track** — Use \`check_order\` and \`list_orders\` to monitor order status.

## Order Fulfillment (read before ordering)

Merka2a is an **aggregator**: products are pulled from distributors such as Mouser and Digi-Key. When you place an order, it is **recorded** (status \`created\`) and then **fulfilled manually** by a Merka2a operator who places the real order with the distributor and ships to you. Expect **1–5 business days** depending on distributor availability.

- **No automatic acceptance / ETA.** The order does not auto-confirm; status advances as the operator processes it. Poll \`check_order\` — \`sourceOrderStatus\` and tracking appear there once the operator acts.
- **Payment is handled separately.** Funds are not captured at order time (Stripe is currently paused).
- **Minimum order quantity (MOQ) is enforced.** Orders below a part's MOQ (e.g. reel/pack quantities from the distributor) are rejected at \`place_order\` with a clear error.

## Key Concepts

- **Offers** are listed by sellers and tied to products. Each offer has a price, inventory count, and optional negotiation rules.
- **Products** have detailed specs, shipping options, and return policies.
- **Negotiation** is multi-round. The seller may: auto-accept (if your price is above their threshold), counter-offer, or decline.
- **Money** is in major currency units in all tool inputs/outputs (e.g. 1299.99 means GBP 1,299.99).

## Supported Workflows

- **Single purchase**: search → (optional negotiate) → order
- **Bulk procurement**: search multiple categories → negotiate volume discounts → place multiple orders
- **Price comparison**: search with different parameters to compare offerings across sellers
- **Refunds & disputes**: cancel orders, request refunds, open disputes if needed
`
