import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient, X402PaymentRequirements } from '@merk.a2a/sdk'
import { textContent } from '../util/format.js'
import { withErrorHandling } from '../util/error-handler.js'
import { signExactAuthorization } from '../x402/sign.js'

/** USDC atomic units (6 dp) → human USD string, 1:1 peg. */
function formatUsdcAtomic(atomic: string): string {
  try {
    const v = BigInt(atomic)
    const whole = v / 1_000_000n
    const frac = (v % 1_000_000n).toString().padStart(6, '0').slice(0, 2)
    return `$${whole.toString()}.${frac} USDC`
  } catch {
    return `${atomic} atomic USDC`
  }
}

function formatTerms(reqs: X402PaymentRequirements): string {
  return [
    '## Payment Required (x402)',
    `- **Amount:** ${formatUsdcAtomic(reqs.maxAmountRequired)}`,
    `- **Network:** ${reqs.network}`,
    `- **Pay to:** \`${reqs.payTo}\``,
    `- **Asset (USDC):** \`${reqs.asset}\``,
    `- **Scheme:** ${reqs.scheme}`,
    `- **Authorization valid for:** ${reqs.maxTimeoutSeconds}s`,
  ].join('\n')
}

export function registerPaymentTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'pay_order',
    'Pay for an order agent-natively via x402 (USDC on Base) — no human browser. ' +
      'Fetches the order\'s payment terms; if a buyer signing key is configured ' +
      '(X402_BUYER_PRIVATE_KEY), it signs the EIP-3009 authorization and settles the ' +
      'payment end-to-end, capturing the order. Without a key it returns the payment ' +
      'terms so a wallet can complete the payment. Orders must be in USD and status ' +
      'created or payment-pending.',
    {
      order_id: z.string().uuid().describe('The order ID to pay'),
    },
    async ({ order_id }) => {
      return withErrorHandling(async () => {
        const terms = await client.getX402Terms(order_id)
        const reqs = terms.accepts?.[0]
        if (!reqs) {
          return textContent(
            '## Payment\n\nThe gateway did not return any x402 payment requirements for this order. ' +
              'The agent-native pay rail may not be configured on this deployment.',
          )
        }

        const privateKey = process.env.X402_BUYER_PRIVATE_KEY
        if (!privateKey) {
          return textContent(
            formatTerms(reqs) +
              '\n\n*No `X402_BUYER_PRIVATE_KEY` is configured, so this tool cannot sign and ' +
              'settle automatically. Set a funded Base wallet key to pay end-to-end, or complete ' +
              'the payment with an external wallet using the terms above.*',
          )
        }

        const { xPaymentB64, from } = await signExactAuthorization(reqs, privateKey)
        const result = await client.submitX402Payment(order_id, xPaymentB64)

        const tx = result.settlement?.transaction ?? result.paymentResponse?.transaction
        return textContent(
          [
            '## Payment Captured (x402)',
            `- **Order:** \`${result.orderId}\``,
            `- **Status:** ${result.status}`,
            `- **Amount:** ${formatUsdcAtomic(reqs.maxAmountRequired)}`,
            `- **Network:** ${result.settlement?.network ?? reqs.network}`,
            `- **Payer:** \`${result.settlement?.payer ?? from}\``,
            tx ? `- **Settlement tx:** \`${tx}\`` : '- **Settlement tx:** (pending confirmation)',
            '',
            'The order is now paid. Use `check_order` to follow provisioning.',
          ].join('\n'),
        )
      }, 'Pay Order')
    },
  )
}
