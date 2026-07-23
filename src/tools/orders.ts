import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { formatOrder, textContent } from '../util/format.js'
import { formatMoney } from '../util/money.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerOrderTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'place_order',
    'Reserve a compute offer at its listed (fixed) price. Requires the offer ID and quantity. ' +
      'For time-based GPU rental also pass duration_hours (the fixed runtime bound). Compute is ' +
      'provisioned, not shipped, so no address is needed. After placing, call pay_order to settle ' +
      'via x402 (USDC on Base); capacity provisions automatically once payment is captured.',
    {
      offer_id: z.string().uuid()
        .describe('The offer ID to order (from search_products)'),
      quantity: z.number().int().positive()
        .describe('Number of units to reserve (default 1)'),
      duration_hours: z.number().int().positive().optional()
        .describe('Fixed runtime in hours for a time-based GPU rental. Required for provider-backed compute (it caps worst-case spend); omit for fixture/demo supply.'),
      // Shipping fields are optional and only used for the shelved physical-goods
      // vertical; compute orders ignore them (the gateway derives provision from
      // the compute.* category).
      shipping_country: z.string().length(2).optional()
        .describe('Only for shipped physical goods: ISO 3166-1 alpha-2 country code. Omit for compute.'),
      shipping_city: z.string().optional()
        .describe('Only for shipped physical goods: city name. Omit for compute.'),
      shipping_postal_code: z.string().optional()
        .describe('Only for shipped physical goods: postal/ZIP code. Omit for compute.'),
      shipping_method: z.enum(['standard', 'express', 'next-day']).optional()
        .describe('Only for shipped physical goods: shipping speed. Omit for compute.'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const hasShipping = input.shipping_country != null
        const order = await client.createOrder({
          offerId: input.offer_id,
          quantity: input.quantity,
          durationHours: input.duration_hours,
          ...(hasShipping
            ? {
                shippingAddress: {
                  country: input.shipping_country!,
                  city: input.shipping_city,
                  postalCode: input.shipping_postal_code,
                },
                shippingMethod: input.shipping_method,
              }
            : {}),
        })

        return textContent(
          formatOrder(order) + '\n\n' +
          `**Order recorded** (status \`created\`) — capacity is reserved at the listed price. ` +
          `Next: call \`pay_order\` with ID \`${order.id}\` to settle via x402 (USDC on Base). ` +
          `Once payment is captured the compute provisions automatically; poll \`check_order\` ` +
          `until the status is \`provisioned\`.`
        )
      }, 'Place Order')
    },
  )

  server.tool(
    'check_order',
    'Get the current status and details of a specific order.',
    {
      order_id: z.string().uuid()
        .describe('The order ID to check'),
    },
    async ({ order_id }) => {
      return withErrorHandling(async () => {
        const order = await client.getOrder(order_id)
        return textContent(formatOrder(order))
      }, 'Check Order')
    },
  )

  server.tool(
    'list_orders',
    'List all past orders for this buyer agent, newest first.',
    {
      limit: z.number().int().min(1).max(100).default(20)
        .describe('Max orders to return (default: 20)'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.listOrders({ limit: input.limit })
        const orders = result.orders ?? result
        if (!Array.isArray(orders) || orders.length === 0) {
          return textContent(
            'No orders found. Use `search_products` to find products and `place_order` to buy.'
          )
        }
        const lines = [`# Your Orders (${orders.length})\n`]
        for (const o of orders) {
          const total = o.total ?? o.totalAmount
          const currency = o.total?.currency ?? o.totalCurrency ?? 'GBP'
          const amount = typeof total === 'object' ? total.amount : total
          lines.push(
            `- **\`${o.id}\`** | ${o.status} | ${formatMoney(amount, currency)} | ${o.createdAt}`
          )
        }
        if (result.pagination?.hasMore) {
          lines.push('\n*More orders available — increase the limit to see them.*')
        }
        return textContent(lines.join('\n'))
      }, 'List Orders')
    },
  )

  server.tool(
    'cancel_order',
    'Cancel an order. Only works for orders that have not yet shipped.',
    {
      order_id: z.string().uuid()
        .describe('The order ID to cancel'),
    },
    async ({ order_id }) => {
      return withErrorHandling(async () => {
        await client.cancelOrder(order_id)
        return textContent(
          `## Order Cancelled\n\n` +
          `Order \`${order_id}\` has been cancelled successfully.`
        )
      }, 'Cancel Order')
    },
  )

  server.tool(
    'request_refund',
    'Request a refund for a delivered order. Provide a clear reason for the refund.',
    {
      order_id: z.string().uuid()
        .describe('The order ID to request a refund for'),
      reason: z.string().min(10).max(2000)
        .describe('Reason for the refund request (10-2000 characters)'),
    },
    async ({ order_id, reason }) => {
      return withErrorHandling(async () => {
        const result = await client.requestRefund(order_id, reason)
        return textContent(
          `## Refund Requested\n\n` +
          `- **Order:** \`${order_id}\`\n` +
          `- **Status:** ${result.status ?? 'refund-requested'}\n` +
          `- **Reason:** ${reason}\n\n` +
          `The seller will review your refund request. Use \`check_order\` to track progress.`
        )
      }, 'Request Refund')
    },
  )
}
