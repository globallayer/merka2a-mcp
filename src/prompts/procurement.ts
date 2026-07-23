import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerProcurementPrompt(server: McpServer): void {
  server.prompt(
    'procurement',
    'Multi-category bulk compute procurement workflow: search, compare, order, and pay with cost tracking',
    {
      shopping_list: z.string()
        .describe('What compute you need to procure, e.g. "16x H100 for training, 8x A100 for inference"'),
      total_budget: z.string().optional()
        .describe('Total budget for everything, e.g. "50000 USD"'),
      region: z.string().default('us-east')
        .describe('Preferred deployment region, e.g. "us-east", "eu-west"'),
    },
    ({ shopping_list, total_budget, region }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `I need to procure the following compute: **${shopping_list}**`,
              total_budget ? `Total budget: **${total_budget}**` : '',
              `Preferred region: **${region}**`,
              '',
              'Prices are fixed at provider retail (no negotiation). Please help me with bulk procurement using this workflow:',
              '1. Break down my request into individual compute categories',
              '2. For each category, search for the best options using `search_products`',
              '3. Compare per-hour prices and specs across sellers and show me a summary table',
              '4. Recommend the best-value offer per category within my budget',
              '5. Show me the total cost across everything',
              '6. With my approval, place all orders (`place_order`) and pay each with `pay_order` (x402 / USDC)',
              '7. Poll `check_order` and give me a final summary with all order IDs, provisioning status, and total spend',
              '',
              'Show me a running cost summary at each stage. Ask for my confirmation before placing and paying for any orders.',
            ].filter(Boolean).join('\n'),
          },
        },
      ],
    }),
  )
}
