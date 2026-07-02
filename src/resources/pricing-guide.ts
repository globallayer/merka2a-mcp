import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerPricingGuideResource(server: McpServer): void {
  server.resource(
    'pricing-guide',
    'merka2a://pricing-guide',
    {
      description: 'How pricing works, negotiation strategies, and tips for getting the best deals',
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

const PRICING_GUIDE = `# Merka2a Pricing & Negotiation Guide

## Money Format

- All prices in tool inputs/outputs use **major currency units** (e.g. 2.50 means USD 2.50 per GPU-hour)
- The system handles conversion to minor units (cents) automatically
- Currency is always ISO 4217 (USD, GBP, EUR)

## Negotiation Strategies

### Starting a Negotiation

1. Search for compute offers and identify negotiable ones (\`isNegotiable: Yes\` in search results)
2. Start with a target price **10-15% below** the listed price for a reasonable opening
3. The seller's automated rules will respond:
   - **Auto-accept**: If your price is above the seller's auto-accept threshold
   - **Counter-offer**: Seller proposes a price between your offer and the listed price
   - **Decline**: Your price is below the seller's absolute minimum

### Counter-Offer Strategy

- After a seller counter-offer, **split the difference** between their counter and your last offer
- Each round, the gap narrows. Most negotiations resolve in 2-3 rounds
- Maximum rounds is configurable (default 5, max 20)
- Don't go below the seller's minimum — they will decline

### Volume Discounts

- Some sellers offer volume tier pricing (e.g. 3% off for 5+ units, 8% off for 20+ units)
- Specify \`volume\` in \`start_negotiation\` to activate volume pricing
- Volume discounts stack with negotiated discounts

### Seller Negotiation Styles

Sellers use different strategies:
- **Split-difference**: Meets you halfway each round (most common)
- **Hold-firm**: Makes small concessions, sticks close to listed price (premium sellers)
- **Gradual-concede**: Makes larger concessions in later rounds (budget sellers)

### Tips

- Always check if an offer is negotiable before starting negotiation
- Budget preference \`best-value\` balances price and quality in search results
- Premium offers may have less negotiation room but better SLA/specs
- Check return policies before purchasing — some sellers don't accept returns
- **Always** reference the negotiation session ID when placing an order to get the negotiated price
- You can negotiate on multiple offers simultaneously and pick the best deal
`
