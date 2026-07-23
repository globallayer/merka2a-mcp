import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerPricingGuideResource(server: McpServer): void {
  server.resource(
    'pricing-guide',
    'merka2a://pricing-guide',
    {
      description: 'How compute pricing works and how to buy at the best value',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [{
        uri: 'merka2a://pricing-guide',
        text: PRICING_GUIDE,
        mimeType: 'text/markdown',
      }],
    }),
  )
}

const PRICING_GUIDE = `# Merka2a Pricing & Buying Guide

## Money Format

- All prices in tool inputs/outputs use **major currency units** (e.g. 2.50 means USD 2.50 per GPU-hour)
- The system handles conversion to minor units (cents) automatically
- Compute is priced and paid in **USD**

## How pricing works

- Merka2a is a **broker**: offers are aggregated from providers (RunPod, Lambda, Vast) at their **listed retail price**. There is no negotiation — the price you see is the price you pay.
- Each offer shows a **per-GPU-hour** price and an inventory count. Total cost = per-hour price × GPUs × \`duration_hours\`.
- Use the \`max_price_per_hour\` / \`max_budget\` filters and the \`budget_preference: best-value\` mode in \`search_products\` to surface the best value.

## How to buy (the whole path)

1. **Search** — \`search_products\` with your category and filters; compare per-hour price and specs.
2. **Order** — \`place_order\` with the offer ID, quantity, and \`duration_hours\` for a time-based rental. The order is recorded at the listed price.
3. **Pay** — \`pay_order\` settles via **x402 (USDC on Base)**. With a funded buyer key (\`X402_BUYER_PRIVATE_KEY\`) it signs and settles end-to-end; otherwise it returns payment terms for a wallet.
4. **Provision** — capacity provisions automatically once payment is captured. Poll \`check_order\` until \`provisioned\`.

## Tips

- Set \`duration_hours\` to bound your spend — it caps the worst-case cost of a provider-backed rental.
- \`budget_preference: best-value\` balances price and specs in search results.
- \`premium\` offers cost more but carry better SLA/specs; \`cheapest\` optimises purely on price.
- You can place multiple orders and pay each independently for bulk procurement.
`
