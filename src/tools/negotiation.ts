import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { toMinorUnits } from '../util/money.js'
import { formatNegotiationSession, textContent } from '../util/format.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerNegotiationTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'start_negotiation',
    'Start a price negotiation on one or more offers. The seller responds instantly with: accept, counter-offer, or decline. Provide your target price in major currency units (e.g. 1200 means GBP 1,200.00). Tip: start 10-15% below listed price for a reasonable opening.',
    {
      offer_ids: z.array(z.string().uuid()).min(1).max(10)
        .describe('Offer IDs to negotiate on (1-10)'),
      target_price: z.number().positive()
        .describe('Your target price in major currency units (e.g. 1200 for GBP 1,200.00)'),
      currency: z.string().length(3).default('GBP')
        .describe('Currency code (default: GBP)'),
      volume: z.number().int().positive().default(1)
        .describe('Quantity for volume discount calculation (default: 1)'),
      max_rounds: z.number().int().min(1).max(20).default(5)
        .describe('Maximum negotiation rounds (default: 5, max: 20)'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.negotiate({
          offerIds: input.offer_ids,
          targetPrice: {
            amount: toMinorUnits(input.target_price, input.currency),
            currency: input.currency,
          },
          volume: input.volume,
          maxRounds: input.max_rounds,
        })

        let advice = ''
        if (result.status === 'accepted') {
          advice = '\n\n**Deal accepted!** Use `place_order` to complete the purchase, referencing session ID `' +
            (result.sessionId ?? result.id) + '`.'
        } else if (result.status === 'countered') {
          advice = '\n\n**The seller countered.** You can:\n' +
            '- Use `counter_offer` to continue negotiating (try splitting the difference)\n' +
            '- Use `accept_deal` to accept the seller\'s counter-price\n' +
            '- Walk away and search for alternatives'
        } else if (result.status === 'rejected' || result.status === 'declined') {
          advice = '\n\n**The seller declined.** Your offer was below their minimum. Try:\n' +
            '- A higher target price (closer to listed price)\n' +
            '- Searching for alternative offers from other sellers'
        }

        return textContent(formatNegotiationSession(result) + advice)
      }, 'Start Negotiation')
    },
  )

  server.tool(
    'counter_offer',
    'Send a counter-offer in an ongoing negotiation. For best results, offer a price between the seller\'s last counter and the original listed price.',
    {
      session_id: z.string().uuid()
        .describe('The negotiation session ID from start_negotiation'),
      price: z.number().positive()
        .describe('Your counter-offer price in major currency units'),
      currency: z.string().length(3).default('GBP')
        .describe('Currency code (default: GBP)'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.continueNegotiation(input.session_id, {
          amount: toMinorUnits(input.price, input.currency),
          currency: input.currency,
        })

        let advice = ''
        if (result.status === 'accepted') {
          advice = '\n\n**Deal accepted!** Use `place_order` with session ID `' +
            (result.sessionId ?? result.id) + '` to complete the purchase.'
        } else if (result.status === 'countered') {
          advice = '\n\n**Seller countered again.** You can `counter_offer` or `accept_deal`.'
        } else if (result.status === 'expired') {
          advice = '\n\n**Negotiation expired.** Maximum rounds reached. Start a new negotiation or buy at listed price.'
        }

        return textContent(formatNegotiationSession(result) + advice)
      }, 'Counter Offer')
    },
  )

  server.tool(
    'accept_deal',
    'Accept the seller\'s most recent counter-offer in a negotiation. Only works when negotiation status is "countered".',
    {
      session_id: z.string().uuid()
        .describe('The negotiation session ID to accept'),
    },
    async ({ session_id }) => {
      return withErrorHandling(async () => {
        const result = await client.acceptNegotiation(session_id)

        return textContent(
          `## Deal Accepted!\n\n` +
          `- **Session ID:** \`${result.sessionId ?? result.id ?? session_id}\`\n` +
          `- **Status:** accepted\n\n` +
          `**Next step:** Use \`place_order\` to create an order. Pass the session ID as \`negotiation_session_id\` to get the negotiated price.`
        )
      }, 'Accept Deal')
    },
  )
}
