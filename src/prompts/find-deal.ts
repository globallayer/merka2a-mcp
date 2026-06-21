import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerFindDealPrompt(server: McpServer): void {
  server.prompt(
    'find-deal',
    'Guided workflow: search for a product, negotiate the best price, and place an order',
    {
      product: z.string()
        .describe('What product are you looking for? e.g. "gaming laptop with 32GB RAM"'),
      budget: z.string().optional()
        .describe('Maximum budget, e.g. "1500 GBP" or "under 2000"'),
      quantity: z.string().default('1')
        .describe('How many units? Default: 1'),
    },
    ({ product, budget, quantity }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `I want to find the best deal on: **${product}**`,
              budget ? `My budget is **${budget}**.` : '',
              quantity && quantity !== '1' ? `I need **${quantity} units**.` : '',
              '',
              'Please follow this workflow:',
              '1. Search for matching products using `search_products`',
              '2. Show me the top results with prices and key specs',
              '3. If any offers are negotiable, recommend which to negotiate on and why',
              '4. Start a negotiation targeting 10-12% below listed price',
              '5. Continue negotiating (counter-offer) until we get a good deal or the seller stops',
              '6. Once we have a deal, help me place the order',
              '',
              'At each step, explain what you\'re doing and ask for my confirmation before proceeding.',
            ].filter(Boolean).join('\n'),
          },
        },
      ],
    }),
  )
}
