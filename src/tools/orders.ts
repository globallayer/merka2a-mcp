import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { formatOrder, textContent } from '../util/format.js'
import { formatMoney } from '../util/money.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerOrderTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'place_order',
    'Place an order for a product. Requires offer ID, quantity, shipping address, and shipping method. Optionally reference a negotiation session for a negotiated price.',
    {
      offer_id: z.string().uuid()
        .describe('The offer ID to order'),
      quantity: z.number().int().positive()
        .describe('Number of units to order'),
      negotiation_session_id: z.string().uuid().optional()
        .describe('Negotiation session ID if you negotiated a price'),
      shipping_country: z.string().length(2)
        .describe('ISO 3166-1 alpha-2 country code, e.g. "GB", "US"'),
      shipping_city: z.string().optional()
        .describe('City name'),
      shipping_postal_code: z.string().optional()
        .describe('Postal/ZIP code'),
      shipping_method: z.enum(['standard', 'express', 'next-day']).default('standard')
        .describe('Shipping speed: standard, express, or next-day'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const order = await client.createOrder({
          offerId: input.offer_id,
          quantity: input.quantity,
          negotiationSessionId: input.negotiation_session_id,
          shippingAddress: {
            country: input.shipping_country,
            city: input.shipping_city,
            postalCode: input.shipping_postal_code,
          },
          shippingMethod: input.shipping_method,
        })

        return textContent(
          formatOrder(order) + '\n\n' +
          `**Order placed successfully!** Track it with \`check_order\` using ID \`${order.id}\`.`
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
