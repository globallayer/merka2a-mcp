import { formatMoney } from './money.js'

export function formatSearchResult(result: any, index: number): string {
  const { offer, product, matchScore, matchDetails } = result
  const price = offer.price ?? offer
  const lines = [
    `## Result ${index + 1}: ${product?.title ?? 'Unknown Product'}`,
    `- **Offer ID:** \`${offer.id}\``,
    `- **Price:** ${formatMoney(price.amount ?? price.priceAmount, price.currency ?? price.priceCurrency ?? 'GBP')}`,
    `- **Condition:** ${product?.condition ?? 'N/A'}`,
    `- **Brand:** ${product?.brand ?? 'N/A'}`,
    `- **Category:** ${product?.category ?? 'N/A'}`,
    `- **Match Score:** ${matchScore}/100`,
    `- **Negotiable:** ${offer.isNegotiable ? 'Yes' : 'No'}`,
    `- **In Stock:** ${offer.inventoryCount ?? 'N/A'} units`,
  ]
  // Seller trust information
  if (matchDetails?.sellerTrust) {
    const trust = matchDetails.sellerTrust
    const stars = trust.reputationScore > 0 ? `${'★'.repeat(Math.round(trust.reputationScore))}${'☆'.repeat(5 - Math.round(trust.reputationScore))}` : 'No ratings'
    const badge = trust.verificationLevel === 'premium' ? '✓✓' : trust.verificationLevel === 'business' ? '✓' : ''
    lines.push(`- **Seller:** ${stars} (${trust.totalReviews} reviews)${badge ? ` ${badge} Verified` : ''}`)
  }
  if (product?.description) {
    lines.push(`- **Description:** ${product.description.slice(0, 200)}`)
  }
  if (matchDetails) {
    if (matchDetails.budgetFit != null) lines.push(`- **Budget Fit:** ${matchDetails.budgetFit ? 'Yes' : 'No'}`)
    if (matchDetails.deliveryFit != null) lines.push(`- **Delivery Fit:** ${matchDetails.deliveryFit ? 'Yes' : 'No'}`)
  }
  if (offer.negotiationRules) {
    const rules = offer.negotiationRules
    if (rules.maxDiscountPercent) lines.push(`- **Max Discount:** ${rules.maxDiscountPercent}%`)
  }
  return lines.join('\n')
}

export function formatNegotiationSession(session: any): string {
  const lines = [
    `## Negotiation Session`,
    `- **Session ID:** \`${session.sessionId ?? session.id}\``,
    `- **Status:** ${session.status}`,
    `- **Round:** ${session.round ?? session.currentRound}/${session.maxRounds}`,
  ]
  if (session.outcomes) {
    for (const o of session.outcomes) {
      lines.push(`### Offer \`${o.offerId}\``)
      if (o.originalPrice) lines.push(`  - Original: ${formatMoney(o.originalPrice.amount, o.originalPrice.currency)}`)
      if (o.proposedPrice) lines.push(`  - Your Offer: ${formatMoney(o.proposedPrice.amount, o.proposedPrice.currency)}`)
      if (o.counterPrice) lines.push(`  - Seller Counter: ${formatMoney(o.counterPrice.amount, o.counterPrice.currency)}`)
      if (o.status) lines.push(`  - Status: ${o.status}`)
      if (o.reason) lines.push(`  - Reason: ${o.reason}`)
    }
  }
  return lines.join('\n')
}

export function formatOrder(order: any): string {
  const lines = [
    `## Order \`${order.id}\``,
    `- **Status:** ${order.status}`,
  ]
  if (order.total ?? order.totalAmount) {
    const amount = order.total?.amount ?? order.totalAmount
    const currency = order.total?.currency ?? order.totalCurrency ?? 'GBP'
    lines.push(`- **Total:** ${formatMoney(amount, currency)}`)
  }
  if (order.subtotal ?? order.subtotalAmount) {
    const amount = order.subtotal?.amount ?? order.subtotalAmount
    const currency = order.subtotal?.currency ?? order.subtotalCurrency ?? 'GBP'
    lines.push(`- **Subtotal:** ${formatMoney(amount, currency)}`)
  }
  if (order.marketplaceFee ?? order.marketplaceFeeAmount) {
    const amount = order.marketplaceFee?.amount ?? order.marketplaceFeeAmount
    const currency = order.marketplaceFee?.currency ?? order.marketplaceFeeCurrency ?? 'GBP'
    lines.push(`- **Marketplace Fee:** ${formatMoney(amount, currency)}`)
  }
  if (order.shipping) {
    const dest = order.shipping.address ?? order.shipping.destination ?? {}
    lines.push(`- **Shipping:** ${order.shipping.method ?? order.shippingMethod ?? 'N/A'} to ${dest.city ?? dest.country ?? 'N/A'}`)
  }
  if (order.items?.length) {
    lines.push(`- **Items:**`)
    for (const item of order.items) {
      const unitPrice = item.unitPrice?.amount ?? item.unitPrice ?? 0
      const currency = item.unitPrice?.currency ?? 'GBP'
      lines.push(`  - ${item.quantity}x @ ${formatMoney(unitPrice, currency)}`)
    }
  }
  if (order.createdAt) {
    lines.push(`- **Created:** ${order.createdAt}`)
  }
  return lines.join('\n')
}

export function textContent(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}
