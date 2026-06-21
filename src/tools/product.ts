import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { formatMoney } from '../util/money.js'
import { textContent } from '../util/format.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerProductTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'get_product',
    'Get detailed information about a specific product offer by searching for it. Use the offer ID from search results. Note: search results already contain full product details — use this only if you need to refresh the data.',
    {
      offer_id: z.string().uuid().describe('The offer ID (UUID) from search results'),
    },
    async ({ offer_id }) => {
      return withErrorHandling(async () => {
        // The API doesn't have a direct GET /v1/offers/:id endpoint.
        // Search results already contain full product+offer data.
        // This tool provides guidance and the offer ID for reference.
        return textContent(
          `## Product Lookup\n\n` +
          `**Offer ID:** \`${offer_id}\`\n\n` +
          `Search results from \`search_products\` already include full product details ` +
          `(title, description, price, specs, shipping, return policy).\n\n` +
          `**What you can do with this offer:**\n` +
          `- **Negotiate:** Use \`start_negotiation\` with this offer ID to negotiate a better price\n` +
          `- **Buy directly:** Use \`place_order\` with this offer ID to purchase at listed price\n` +
          `- **Search again:** Use \`search_products\` to find similar or alternative products`
        )
      }, 'Get Product')
    },
  )
}
