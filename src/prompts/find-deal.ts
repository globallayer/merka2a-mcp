import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerFindDealPrompt(server: McpServer): void {
  server.prompt(
    'buy-compute',
    'Guided workflow: search for a GPU/compute offer and buy it end-to-end (place order, pay via x402, provision)',
    {
      product: z.string()
        .describe('What compute do you need? e.g. "8x H100 80GB for training"'),
      budget: z.string().optional()
        .describe('Maximum budget, e.g. "5 USD/hr" or "under 10000"'),
      duration_hours: z.string().optional()
        .describe('How many hours of runtime? e.g. "24" (needed for time-based GPU rental)'),
      quantity: z.string().default('1')
        .describe('How many units? Default: 1'),
    },
    ({ product, budget, duration_hours, quantity }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `I want to buy compute: **${product}**`,
              budget ? `My budget is **${budget}**.` : '',
              duration_hours ? `I need it for **${duration_hours} hours**.` : '',
              quantity && quantity !== '1' ? `I need **${quantity} units**.` : '',
              '',
              'Prices are fixed at provider retail (no negotiation). Please follow this workflow:',
              '1. Search matching compute offers with `search_products`',
              '2. Show me the top results with per-hour prices, GPU specs, and stock',
              '3. Recommend the best-value offer within my budget and explain why',
              '4. Place the order with `place_order` (pass `duration_hours` for a time-based rental)',
              '5. Pay agent-natively with `pay_order` (x402 / USDC on Base)',
              '6. Poll `check_order` until the status is `provisioned`, then give me the access details',
              '',
              'At each step, explain what you\'re doing and confirm the total cost before you place and pay.',
            ].filter(Boolean).join('\n'),
          },
        },
      ],
    }),
  )
}
