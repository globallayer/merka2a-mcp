import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerProcurementPrompt(server: McpServer): void {
  server.prompt(
    'procurement',
    'Multi-category bulk purchasing workflow with volume negotiation and cost tracking',
    {
      shopping_list: z.string()
        .describe('What you need to procure, e.g. "5 developer laptops, 5 monitors, 10 keyboards for a new office"'),
      total_budget: z.string().optional()
        .describe('Total budget for everything, e.g. "25000 GBP"'),
      destination_country: z.string().default('GB')
        .describe('ISO country code for delivery, e.g. "GB", "US"'),
    },
    ({ shopping_list, total_budget, destination_country }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `I need to procure the following items: **${shopping_list}**`,
              total_budget ? `Total budget: **${total_budget}**` : '',
              `Delivery to: **${destination_country}**`,
              '',
              'Please help me with bulk procurement using this workflow:',
              '1. Break down my request into individual product categories',
              '2. For each category, search for the best options using `search_products`',
              '3. Compare prices across sellers and show me a summary table',
              '4. For negotiable offers, negotiate volume discounts (specify the quantity for volume pricing)',
              '5. Show me the total cost before and after negotiation',
              '6. With my approval, place all orders',
              '7. Provide a final procurement summary with all order IDs and total spend',
              '',
              'Show me a running cost summary at each stage. Ask for my confirmation before placing any orders.',
            ].filter(Boolean).join('\n'),
          },
        },
      ],
    }),
  )
}
