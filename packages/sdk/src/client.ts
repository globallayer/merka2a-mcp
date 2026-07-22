import type {
  AgentRegistration,
  AgentRegistrationResponse,
  SearchIntentRequest,
  BuyerIntent,
  NegotiateRequest,
  NegotiateContinueRequest,
  CreateOrderRequest,
  OpenDisputeRequest,
  ProductUpsert,
  OfferUpsert,
  CreateReviewRequest,
  Review,
  TrustProfile,
  AIServiceSearchRequest,
  AIServiceUpsert,
  AIServiceOffer,
} from '@merk.a2a/schema'

export interface Merka2aClientOptions {
  baseUrl: string
  apiKey?: string
}

// --- Order Lifecycle Response Types ---

export interface CancelOrderResponse {
  id: string
  status: 'cancelled'
  refundAmount: number
  processingFee: number
  currency: string
}

export interface ReturnRequestResponse {
  id: string
  status: 'return-requested'
  rmaCode: string
  reason: string
}

export interface ReturnShipmentResponse {
  id: string
  status: 'return-shipped'
  returnStatus: 'shipped'
  trackingNumber: string
}

export interface ConfirmReturnResponse {
  id: string
  buyerId: string
  status: 'return-received' | 'disputed'
  returnStatus: 'received'
  condition: 'good' | 'damaged' | 'wrong-item' | 'missing-parts'
  refundAmount: number
  restockingFee: number
  currency: string
  disputeOpened?: boolean
}

export interface ReturnRefundResponse {
  id: string
  buyerId: string
  status: 'refunded'
  refundAmount: number
  restockingFee: number
  currency: string
}

export interface PaginationParams {
  cursor?: string
  limit?: number
}

// --- Dashboard Response Types ---

export interface SellerDashboardResponse {
  success: boolean
  data: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    conversionRate: number
    activeListings: number
    pendingOrders: number
    reputationScore: number
    totalReviews: number
    periodRevenue: number
    periodOrders: number
    revenueChange: number
    ordersChange: number
  }
  period: { days: number; start: string; end: string }
}

export interface SellerSalesResponse {
  success: boolean
  data: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  period: { days: number; granularity: string }
}

export interface SellerNegotiationStatsResponse {
  success: boolean
  data: {
    totalNegotiations: number
    acceptedNegotiations: number
    rejectedNegotiations: number
    avgDiscountPercent: number
    avgNegotiationRounds: number
    acceptanceRate: number
    avgTimeToAccept: number
  }
  period: { days: number }
}

export interface SellerPayoutsResponse {
  success: boolean
  data: {
    totalPaid: number
    pendingAmount: number
    nextPayoutDate?: string
    payouts: Array<{
      id: string
      amount: number
      currency: string
      status: string
      stripeTransferId?: string
      createdAt: string
      completedAt?: string
    }>
  }
}

export interface BuyerDashboardResponse {
  success: boolean
  data: {
    totalSpent: number
    totalOrders: number
    totalSavings: number
    savingsPercent: number
    activeNegotiations: number
    pendingOrders: number
    completedOrders: number
    favoriteCategories: Array<{ category: string; spent: number; orders: number }>
    periodSpent: number
    periodOrders: number
    spendChange: number
  }
  period: { days: number; start: string; end: string }
}

export interface BuyerSavingsResponse {
  success: boolean
  data: {
    totalListPrice: number
    totalPaid: number
    totalSavings: number
    savingsPercent: number
    byNegotiation: Array<{
      orderId: string
      productTitle: string
      listPrice: number
      finalPrice: number
      savings: number
      savingsPercent: number
      negotiationRounds: number
      createdAt: string
    }>
  }
}

export interface BuyerSpendingResponse {
  success: boolean
  data: Array<{
    date: string
    spent: number
    orders: number
    savings: number
  }>
  period: { days: number; granularity: string }
}

// --- Notification Response Types ---

export interface NotificationPreferences {
  email: {
    orderConfirmed: boolean
    orderShipped: boolean
    orderDelivered: boolean
    negotiationAccepted: boolean
    negotiationCountered: boolean
    payoutSent: boolean
    reviewReceived: boolean
    weeklyDigest: boolean
  }
  webhook: {
    allEvents: boolean
  }
}

export interface NotificationPreferencesResponse {
  success: boolean
  preferences: NotificationPreferences
}

export interface NotificationLogsResponse {
  success: boolean
  logs: Array<{
    id: string
    type: string
    channel: string
    subject?: string
    status: string
    sentAt?: string
    errorMessage?: string
    createdAt: string
  }>
}

// --- Referral Response Types ---

export interface ReferralCodeResponse {
  success: boolean
  referralCode: string | null
  shareUrl?: string
  credits?: number
  message?: string
}

export interface ReferralsListResponse {
  success: boolean
  referralCode: string | null
  currentCredits: number
  stats: {
    totalReferrals: number
    qualifiedReferrals: number
    totalCreditsEarned: number
    creditsPerReferral: number
  }
  referrals: Array<{
    id: string
    referredName: string
    status: string
    creditsAwarded: number
    qualifiedAt?: string
    creditedAt?: string
    createdAt: string
  }>
}

// --- Discovery & Identity Response Types ---

export interface DIDResponse {
  did: string
  didDocument: Record<string, unknown>
  message?: string
  agent: {
    id: string
    name: string
    role: string
  }
}

export interface CapabilityResponse {
  id: string
  agentId: string
  capabilityType: string
  name: string
  description?: string
  version?: string
  metadata?: Record<string, unknown>
  isActive: boolean
  endorsements: number
  createdAt: string
  updatedAt: string
}

export interface DiscoverAgentsResponse {
  agents: Array<{
    id: string
    name: string
    role: string
    did?: string
    reputationScore: number
    verificationLevel: string
    totalReviews: number
    capabilities: Array<{
      type: string
      name: string
      endorsements: number
    }>
    categories: string[]
    joinedAt: string
  }>
  total: number
  cursor?: string
  hasMore: boolean
}

export interface DiscoverCapabilitiesResponse {
  capabilities: Array<{
    type: string
    agentCount: number
    capabilityCount: number
  }>
}

export interface DiscoveryStatsResponse {
  total_sellers: number
  total_buyers: number
  total_capabilities: number
  agents_with_capabilities: number
  agents_with_did: number
  verified_sellers: number
}

export interface EndorsementResponse {
  id: string
  capabilityId: string
  endorserId: string
  endorsementType: string
  comment?: string
}

// --- Enterprise & Currency Response Types ---

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimals: number
  isCrypto: boolean
}

export interface CurrenciesResponse {
  currencies: CurrencyInfo[]
  fiat: string[]
  crypto: string[]
}

export interface ExchangeRatesResponse {
  base: string
  rates: Record<string, number>
  timestamp: string
  source: string
}

export interface ConversionResponse {
  from: {
    amount: number
    currency: string
    formatted: string
  }
  to: {
    amount: number
    currency: string
    formatted: string
  }
  rate: number
  timestamp: string
}

export interface EnterpriseTier {
  id: string
  name: string
  rateLimit: number
  maxWebhooks?: number
  maxProducts?: number
  supportLevel?: string
  features: string[]
  price?: {
    amount: number
    currency: string
    period: string
  }
}

export interface EnterpriseTiersResponse {
  tiers: EnterpriseTier[]
}

export interface EnterpriseStatusResponse {
  tier: EnterpriseTier
  activated: boolean
  activatedAt?: string
  enterpriseKeyPrefix?: string
  usage: {
    apiCalls: number
    ordersCreated: number
    gmvAmount: number
    webhookDeliveries: number
    periodStart: string
    periodEnd: string
  } | null
}

export interface EnterpriseRegisterResponse {
  success: boolean
  tier: EnterpriseTier
  enterpriseApiKey: string
  message: string
  note?: string
}

export interface EnterpriseUsageResponse {
  tier: EnterpriseTier
  current: {
    periodStart: string
    periodEnd: string
    apiCalls: number
    ordersCreated: number
    gmvAmount: number
    webhookDeliveries: number
  } | null
  history: Array<{
    periodStart: string
    periodEnd: string
    apiCalls: number
    ordersCreated: number
    gmvAmount: number
    gmvCurrency: string
    webhookDeliveries: number
    uniqueBuyers: number
    uniqueSellers: number
  }>
  totals: {
    apiCalls: number
    ordersCreated: number
    gmvAmount: number
    webhookDeliveries: number
  }
  limits: {
    rateLimit: number
    maxWebhooks: number
    maxProducts: number
  }
}

// --- Promotion Response Types ---

export interface PromotionResponse {
  id: string
  offerId: string
  bidAmount: number
  dailyBudget: number
  totalBudget?: number
  targetCategories: string[]
  targetKeywords: string[]
  status: 'active' | 'paused' | 'ended'
  startDate: string
  endDate?: string
  createdAt: string
  updatedAt?: string
}

export interface PromotionWithPerformance extends PromotionResponse {
  offerCategory?: string
  productTitle?: string
  performance: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    ctr: number
    conversionRate: number
    costPerClick?: number
    costPerConversion?: number
  }
}

export interface PromotionStatsResponse {
  activePromotions: number
  totalPromotions: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: number
  totalDailyBudget: number
  avgCtr: number
  avgConversionRate: number
}

// --- Market Analytics Response Types ---

export interface MarketOverviewResponse {
  totalGMV: number
  totalOrders: number
  totalListings: number
  totalSellers: number
  totalBuyers: number
  avgOrderValue: number
  topCategories: Array<{
    category: string
    gmv: number
    orders: number
    growth: number
  }>
  period: {
    start: string
    end: string
    days: number
  }
}

export interface PricingTrendResponse {
  trends: Array<{
    category: string
    currentAvgPrice: number
    previousAvgPrice: number
    priceChange: number
    priceChangePercent: number
    minPrice: number
    maxPrice: number
    medianPrice: number
    currency: string
    period: string
  }>
}

export interface DemandMetricsResponse {
  metrics: Array<{
    category: string
    searchCount: number
    viewCount: number
    negotiationCount: number
    orderCount: number
    conversionRate: number
    demandScore: number
    trend: 'rising' | 'stable' | 'falling'
    period: string
  }>
}

export interface SupplyMetricsResponse {
  metrics: Array<{
    category: string
    totalListings: number
    activeListings: number
    newListings: number
    avgInventory: number
    sellerCount: number
    avgSellerRating: number
    supplyScore: number
    period: string
  }>
}

export interface CategoryInsightResponse {
  category: string
  pricing: PricingTrendResponse['trends'][0]
  demand: DemandMetricsResponse['metrics'][0]
  supply: SupplyMetricsResponse['metrics'][0]
  competitiveness: number
  opportunity: number
  recommendations: string[]
}

export interface TrendingCategoriesResponse {
  trending: Array<{
    category: string
    demandScore: number
    searchCount: number
    conversionRate: number
    trend: 'rising' | 'stable' | 'falling'
  }>
}

export interface MarketOpportunitiesResponse {
  opportunities: Array<{
    category: string
    opportunityScore: number
    demandScore: number
    supplyScore: number
    trend: 'rising' | 'stable' | 'falling'
    activeListings: number
    sellerCount: number
  }>
}

// --- Premium Response Types ---

export interface PremiumTierResponse {
  id: string
  name: string
  price: {
    amount: number
    currency: string
    interval: string
  }
  features: string[]
  limits: {
    promotedListings: number
    apiCallsPerDay: number
    searchResultsBoost: number
    analyticsRetentionDays: number
    supportLevel: string
  }
}

export interface PremiumTiersResponse {
  tiers: PremiumTierResponse[]
}

export interface PremiumStatusResponse {
  tier: string
  config: {
    name: string
    features: string[]
    limits: Record<string, number | string>
  }
  expiresAt?: string
  isActive: boolean
}

export interface PremiumFeaturesResponse {
  features: Array<{
    type: string
    isEnabled: boolean
    expiresAt?: string
    config?: Record<string, unknown>
  }>
}

// --- Reviews & Trust Response Types ---

export interface SellerReviewsResponse {
  summary: {
    totalReviews: number
    averageRating: number
    pendingResponses: number
  }
  reviews: Array<{
    id: string
    orderId: string
    rating: number
    title?: string
    comment?: string
    response?: string
    responseAt?: string
    isVerifiedPurchase: boolean
    isFlagged: boolean
    createdAt: string
    reviewer: {
      id: string
      name: string
    }
  }>
}

export interface VerificationStatus {
  email: {
    verified: boolean
    address: string
  }
  business: {
    verified: boolean
  }
  verificationLevel: 'none' | 'email' | 'business' | 'premium'
  nextSteps: string[]
}

// --- AI Services Response Types ---

export interface AIServiceResponse {
  id: string
  sellerId: string
  serviceType: string
  name: string
  description: string | null
  pricingModel: string
  pricing: any
  capabilities: any
  sla: {
    availabilityPercent: number | null
    maxLatencyP50Ms: number | null
    maxLatencyP99Ms: number | null
    supportResponseTimeHours: number | null
    dataResidency: string[] | null
  }
  apiEndpoint: string | null
  documentationUrl: string | null
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface SubscriptionResponse {
  id: string
  serviceId: string
  serviceName?: string
  serviceType?: string
  planName: string
  pricingModel: string
  price: {
    amount: number
    currency: string
  }
  billingPeriod: 'monthly' | 'annual'
  status: 'pending' | 'active' | 'paused' | 'cancelled' | 'expired'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  includedTokens?: number
  includedRequests?: number
  rateLimitRpm?: number
}

// --- x402 Agent-Native Payment Types (DEC-051) ---

/** x402 PaymentRequirements as advertised in the 402 `accepts[]` array. */
export interface X402PaymentRequirements {
  scheme: 'exact'
  network: string
  /** Max amount payable in the asset's atomic units (USDC = 6 dp), as a string. */
  maxAmountRequired: string
  resource: string
  description: string
  mimeType: string
  payTo: string
  maxTimeoutSeconds: number
  /** ERC-20 (USDC) contract address. */
  asset: string
  /** EIP-712 domain hints for the asset. */
  extra: { name: string; version: string }
}

/** The 402 challenge body returned when no X-PAYMENT header is supplied. */
export interface X402TermsResponse {
  x402Version: number
  error: string
  accepts: X402PaymentRequirements[]
}

/** Result of a settled x402 payment (200 body from the pay-x402 endpoint). */
export interface X402PaymentResult {
  orderId: string
  status: 'payment-captured'
  paymentMethod: 'x402'
  settlement: {
    transaction?: string
    network?: string
    payer?: string
  }
  /** Decoded X-PAYMENT-RESPONSE header, when present. */
  paymentResponse?: {
    success: boolean
    transaction?: string
    network?: string
    payer?: string
  }
}

export class Merka2aClient {
  private baseUrl: string
  private apiKey: string | undefined

  constructor(opts: Merka2aClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
  }

  setApiKey(key: string) {
    this.apiKey = key
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const headers: Record<string, string> = { ...extraHeaders }
    if (body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`

    const isJson = headers['Content-Type'] === 'application/json'
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? (isJson ? JSON.stringify(body) : String(body)) : undefined,
    })

    const data = await res.json() as any
    if (!res.ok) {
      const msg = data?.error ?? res.statusText
      throw new Merka2aError(msg, res.status, data)
    }
    return data as T
  }

  private qs(params?: PaginationParams): string {
    if (!params) return ''
    const parts: string[] = []
    if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`)
    if (params.limit) parts.push(`limit=${params.limit}`)
    return parts.length > 0 ? `?${parts.join('&')}` : ''
  }

  // --- Health ---
  health() { return this.request('GET', '/health') }

  // --- Schemas ---
  listSchemas() { return this.request('GET', '/v1/schemas') }
  getSchema(name: string) { return this.request('GET', `/v1/schemas/${name}`) }
  getCategories() { return this.request('GET', '/v1/schemas/categories') }

  // --- Agent management ---
  registerAgent(registration: AgentRegistration) {
    return this.request<AgentRegistrationResponse>('POST', '/v1/agents/register', registration)
  }
  getMe() { return this.request('GET', '/v1/agents/me') }
  rotateKey() { return this.request<{ apiKey: string; prefix: string }>('POST', '/v1/agents/me/rotate-key') }

  // --- Seller: Catalog ---
  upsertProducts(products: ProductUpsert[]) {
    return this.request('PUT', '/v1/seller/products', { products })
  }
  upsertOffers(offers: OfferUpsert[]) {
    return this.request('PUT', '/v1/seller/offers', { offers })
  }
  deleteOffer(offerId: string) {
    return this.request('DELETE', `/v1/seller/offers/${offerId}`)
  }

  // --- Seller: Feed Ingestion ---
  submitFeedCsv(csvContent: string) {
    return this.request('POST', '/v1/seller/feed', csvContent, { 'Content-Type': 'text/csv' })
  }
  submitFeedJson(products: Array<Record<string, unknown>>) {
    return this.request('POST', '/v1/seller/feed', { products })
  }
  listFeeds(pagination?: PaginationParams) {
    return this.request('GET', `/v1/seller/feeds${this.qs(pagination)}`)
  }
  getFeed(feedId: string) {
    return this.request('GET', `/v1/seller/feeds/${feedId}`)
  }

  // --- Webhooks ---
  registerWebhook(request: { url: string; events: string[]; description?: string }) {
    return this.request('POST', '/v1/webhooks', request)
  }
  listWebhooks(pagination?: PaginationParams) {
    return this.request('GET', `/v1/webhooks${this.qs(pagination)}`)
  }
  getWebhook(webhookId: string) {
    return this.request('GET', `/v1/webhooks/${webhookId}`)
  }
  updateWebhook(webhookId: string, request: { url?: string; events?: string[]; active?: boolean; description?: string }) {
    return this.request('PATCH', `/v1/webhooks/${webhookId}`, request)
  }
  deleteWebhook(webhookId: string) {
    return this.request('DELETE', `/v1/webhooks/${webhookId}`)
  }
  listWebhookDeliveries(webhookId: string) {
    return this.request('GET', `/v1/webhooks/${webhookId}/deliveries`)
  }

  // --- Buyer: Search ---
  searchIntent(intent: BuyerIntent, pagination?: { limit?: number; cursor?: string }) {
    return this.request('POST', '/v1/search-intent', { intent, pagination })
  }

  // --- Buyer: Negotiate ---
  negotiate(request: { offerIds: string[]; targetPrice: { amount: number; currency: string }; volume?: number; maxRounds?: number }) {
    return this.request('POST', '/v1/negotiate', request)
  }
  continueNegotiation(sessionId: string, counterPrice: { amount: number; currency: string }) {
    return this.request('POST', `/v1/negotiate/${sessionId}`, { counterPrice })
  }
  getNegotiation(sessionId: string) {
    return this.request('GET', `/v1/negotiate/${sessionId}`)
  }
  acceptNegotiation(sessionId: string) {
    return this.request('POST', `/v1/negotiate/${sessionId}/accept`)
  }

  // --- Buyer: Orders ---
  /**
   * Place an order. Pass `opts.idempotencyKey` to make a retried create-order safe:
   * the gateway deduplicates by (buyer, key) and returns the original order instead
   * of booking a second one. Omit it and no header is sent (behavior unchanged).
   */
  createOrder(
    request: { offerId: string; quantity: number; negotiationSessionId?: string; shippingAddress?: { country: string; postalCode?: string; city?: string }; shippingMethod?: string; fulfillmentType?: 'ship' | 'provision' },
    opts?: { idempotencyKey?: string },
  ) {
    const extraHeaders = opts?.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : undefined
    return this.request('POST', '/v1/create-order', request, extraHeaders)
  }
  listOrders(pagination?: PaginationParams) {
    return this.request('GET', `/v1/orders${this.qs(pagination)}`)
  }
  getOrder(orderId: string) {
    return this.request('GET', `/v1/orders/${orderId}`)
  }
  cancelOrder(orderId: string, reason?: string) {
    return this.request<CancelOrderResponse>('POST', `/v1/orders/${orderId}/cancel`, reason ? { reason } : undefined)
  }
  /** @deprecated Use requestReturn for shipped/delivered orders */
  requestRefund(orderId: string, reason: string) {
    return this.request('POST', `/v1/orders/${orderId}/refund`, { reason })
  }
  /** @deprecated Use approveReturnRefund for return flow */
  approveRefund(orderId: string) {
    return this.request('POST', `/v1/orders/${orderId}/approve-refund`)
  }
  openDispute(orderId: string, request: { type: string; description: string }) {
    return this.request('POST', `/v1/orders/${orderId}/dispute`, request)
  }

  // --- Buyer: Returns ---
  /** Request a return for a shipped or delivered order. Returns RMA code for tracking. */
  requestReturn(orderId: string, reason: string) {
    return this.request<ReturnRequestResponse>('POST', `/v1/orders/${orderId}/return`, { reason })
  }
  /** Submit return shipment tracking number after shipping item back to seller. */
  updateReturnShipment(orderId: string, trackingNumber: string) {
    return this.request<ReturnShipmentResponse>('POST', `/v1/orders/${orderId}/return/ship`, { trackingNumber })
  }

  // --- Disputes ---
  listDisputes() { return this.request('GET', '/v1/disputes') }
  getDispute(disputeId: string) { return this.request('GET', `/v1/disputes/${disputeId}`) }
  resolveDispute(disputeId: string, request: { status: 'resolved' | 'rejected'; resolution: string }) {
    return this.request('PATCH', `/v1/disputes/${disputeId}`, request)
  }

  // --- Seller: Orders ---
  updateOrderStatus(orderId: string, status: string, note?: string) {
    return this.request('PATCH', `/v1/orders/${orderId}`, { status, note })
  }

  // --- Seller: Returns ---
  /** Confirm receipt of returned item. Condition determines next steps (good = auto-refund, damaged = dispute). */
  confirmReturn(orderId: string, condition: 'good' | 'damaged' | 'wrong-item' | 'missing-parts', notes?: string) {
    return this.request<ConfirmReturnResponse>('POST', `/v1/orders/${orderId}/confirm-return`, { condition, notes })
  }
  /** Approve refund for a return-received order. Applies 5% restocking fee. */
  approveReturnRefund(orderId: string) {
    return this.request<ReturnRefundResponse>('POST', `/v1/orders/${orderId}/approve-return-refund`)
  }

  // --- Reviews & Trust ---
  /** Submit a review for a completed order (buyer only) */
  submitReview(request: { orderId: string; rating: number; title?: string; comment?: string }) {
    return this.request<Review>('POST', '/v1/reviews', request)
  }
  /** Respond to a review (seller only) */
  respondToReview(reviewId: string, response: string) {
    return this.request<Review>('POST', `/v1/seller/reviews/${reviewId}/respond`, { response })
  }
  /** Get reviews received by this seller with summary stats */
  getSellerReviews() {
    return this.request<SellerReviewsResponse>('GET', '/v1/seller/reviews')
  }
  /** List reviews for any agent */
  listReviews(agentId: string, pagination?: PaginationParams) {
    return this.request<{ reviews: Review[]; hasMore: boolean }>('GET', `/v1/agents/${agentId}/reviews${this.qs(pagination)}`)
  }
  /** Get trust profile for any agent */
  getTrustProfile(agentId: string) {
    return this.request<TrustProfile>('GET', `/v1/agents/${agentId}/trust`)
  }
  /** Flag a review as inappropriate */
  flagReview(reviewId: string, reason: 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other', details?: string) {
    return this.request<{ id: string; isFlagged: boolean; message: string }>('POST', `/v1/reviews/${reviewId}/flag`, { reason, details })
  }

  // --- Verification ---
  /** Request email verification (seller only) */
  requestEmailVerification() {
    return this.request<{ message: string; email: string; expiresIn: number }>('POST', '/v1/seller/verify/email')
  }
  /** Confirm email with verification code (seller only) */
  confirmEmailVerification(code: string) {
    return this.request<{ verified: boolean; verificationLevel: string }>('POST', '/v1/seller/verify/email/confirm', { code })
  }
  /** Submit business verification documents (seller only) */
  requestBusinessVerification(request: { registrationNumber: string; documentType: string; documentUrl?: string }) {
    return this.request<{ status: string; message: string }>('POST', '/v1/seller/verify/business', request)
  }
  /** Get current verification status (seller only) */
  getVerificationStatus() {
    return this.request<VerificationStatus>('GET', '/v1/seller/verification-status')
  }

  // --- AI Services: Buyer ---

  /** Search AI services by type, capabilities, SLA requirements */
  searchAIServices(request: AIServiceSearchRequest) {
    return this.request<{ services: AIServiceResponse[]; pagination: { cursor?: string; hasMore: boolean } }>('POST', '/v1/ai-services/search', request)
  }
  /** Get details of a specific AI service */
  getAIService(serviceId: string) {
    return this.request<AIServiceResponse>('GET', `/v1/ai-services/${serviceId}`)
  }
  /** Compare multiple AI services side-by-side */
  compareAIServices(serviceIds: string[]) {
    return this.request<{ services: AIServiceResponse[] }>('POST', '/v1/ai-services/compare', { serviceIds })
  }
  /** Subscribe to an AI service */
  subscribeToAIService(serviceId: string, planName: string, billingPeriod: 'monthly' | 'annual') {
    return this.request<SubscriptionResponse>('POST', `/v1/ai-services/${serviceId}/subscribe`, { planName, billingPeriod })
  }
  /** List buyer's subscriptions */
  listSubscriptions(pagination?: PaginationParams) {
    return this.request<{ subscriptions: SubscriptionResponse[]; pagination: { cursor?: string; hasMore: boolean } }>('GET', `/v1/subscriptions${this.qs(pagination)}`)
  }
  /** Get subscription details */
  getSubscription(subscriptionId: string) {
    return this.request<SubscriptionResponse>('GET', `/v1/subscriptions/${subscriptionId}`)
  }
  /** Cancel subscription (immediate or at period end) */
  cancelSubscription(subscriptionId: string, immediately: boolean = false) {
    return this.request<{ id: string; status: string; cancelAtPeriodEnd?: boolean; cancelledAt?: string }>('POST', `/v1/subscriptions/${subscriptionId}/cancel`, { cancelImmediately: immediately })
  }
  /** Pause an active subscription */
  pauseSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: 'paused' }>('POST', `/v1/subscriptions/${subscriptionId}/pause`)
  }
  /** Resume a paused subscription */
  resumeSubscription(subscriptionId: string) {
    return this.request<{ id: string; status: 'active' }>('POST', `/v1/subscriptions/${subscriptionId}/resume`)
  }

  // --- AI Services: Seller ---

  /** List seller's AI services */
  listAIServices(pagination?: PaginationParams) {
    return this.request<{ services: AIServiceResponse[]; pagination: { cursor?: string; hasMore: boolean } }>('GET', `/v1/seller/ai-services${this.qs(pagination)}`)
  }
  /** Create or update an AI service */
  upsertAIService(service: AIServiceUpsert) {
    return this.request<{ id: string; created?: boolean; updated?: boolean }>('POST', '/v1/seller/ai-services', service)
  }
  /** Get a specific AI service (seller) */
  getSellerAIService(serviceId: string) {
    return this.request<AIServiceResponse>('GET', `/v1/seller/ai-services/${serviceId}`)
  }
  /** Update AI service status (active, paused, deprecated) */
  updateAIServiceStatus(serviceId: string, status: 'active' | 'paused' | 'deprecated') {
    return this.request<{ id: string; status: string }>('PATCH', `/v1/seller/ai-services/${serviceId}/status`, { status })
  }
  /** Delete AI service (soft delete via deprecation) */
  deleteAIService(serviceId: string) {
    return this.request<void>('DELETE', `/v1/seller/ai-services/${serviceId}`)
  }

  // --- Seller Dashboard ---

  /** Get seller dashboard summary */
  getSellerDashboard(period: number = 30) {
    return this.request<SellerDashboardResponse>('GET', `/v1/seller/dashboard/summary?period=${period}`)
  }
  /** Get seller sales data over time */
  getSellerSales(period: number = 30, granularity: 'day' | 'week' | 'month' = 'day') {
    return this.request<SellerSalesResponse>('GET', `/v1/seller/dashboard/sales?period=${period}&granularity=${granularity}`)
  }
  /** Get seller negotiation statistics */
  getSellerNegotiationStats(period: number = 30) {
    return this.request<SellerNegotiationStatsResponse>('GET', `/v1/seller/dashboard/negotiations?period=${period}`)
  }
  /** Get seller payout summary and history */
  getSellerPayouts(limit: number = 10) {
    return this.request<SellerPayoutsResponse>('GET', `/v1/seller/dashboard/payouts?limit=${limit}`)
  }

  // --- Buyer Dashboard ---

  /** Get buyer dashboard summary */
  getBuyerDashboard(period: number = 30) {
    return this.request<BuyerDashboardResponse>('GET', `/v1/buyer/dashboard/summary?period=${period}`)
  }
  /** Get buyer savings breakdown */
  getBuyerSavings(limit: number = 20) {
    return this.request<BuyerSavingsResponse>('GET', `/v1/buyer/dashboard/savings?limit=${limit}`)
  }
  /** Get buyer spending over time */
  getBuyerSpending(period: number = 30, granularity: 'day' | 'week' | 'month' = 'day') {
    return this.request<BuyerSpendingResponse>('GET', `/v1/buyer/dashboard/spending?period=${period}&granularity=${granularity}`)
  }

  // --- Notifications ---

  /** Get notification preferences */
  getNotificationPreferences() {
    return this.request<NotificationPreferencesResponse>('GET', '/v1/agents/me/notifications')
  }
  /** Update notification preferences */
  updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
    return this.request<NotificationPreferencesResponse>('PUT', '/v1/agents/me/notifications', preferences)
  }
  /** Get notification logs */
  getNotificationLogs(limit: number = 50, type?: string) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (type) params.set('type', type)
    return this.request<NotificationLogsResponse>('GET', `/v1/agents/me/notifications/logs?${params}`)
  }

  // --- Referrals ---

  /** Generate a referral code */
  generateReferralCode() {
    return this.request<ReferralCodeResponse>('POST', '/v1/agents/me/referral-code')
  }
  /** Get current referral code */
  getReferralCode() {
    return this.request<ReferralCodeResponse>('GET', '/v1/agents/me/referral-code')
  }
  /** List referrals and credits */
  listReferrals(limit: number = 50) {
    return this.request<ReferralsListResponse>('GET', `/v1/agents/me/referrals?limit=${limit}`)
  }

  // --- Discovery & Identity ---

  /** Generate or retrieve your DID */
  generateDID() {
    return this.request<DIDResponse>('POST', '/v1/agents/me/did')
  }
  /** Get your current DID */
  getMyDID() {
    return this.request<DIDResponse>('GET', '/v1/agents/me/did')
  }
  /** Get any agent's DID */
  getAgentDID(agentId: string) {
    return this.request<DIDResponse>('GET', `/v1/agents/${agentId}/did`)
  }
  /** Resolve a DID string to agent profile */
  resolveDID(did: string) {
    return this.request<{ did: string; didDocument: Record<string, unknown>; agent?: Record<string, unknown> }>('GET', `/v1/did/resolve?did=${encodeURIComponent(did)}`)
  }

  // --- Capabilities ---

  /** Register a new capability */
  registerCapability(capability: { capabilityType: string; name: string; description?: string; version?: string; metadata?: Record<string, unknown> }) {
    return this.request<CapabilityResponse>('POST', '/v1/agents/me/capabilities', capability)
  }
  /** List your capabilities */
  listMyCapabilities() {
    return this.request<{ capabilities: CapabilityResponse[] }>('GET', '/v1/agents/me/capabilities')
  }
  /** List any agent's capabilities */
  listAgentCapabilities(agentId: string) {
    return this.request<{ agentId: string; capabilities: CapabilityResponse[] }>('GET', `/v1/agents/${agentId}/capabilities`)
  }
  /** Update a capability */
  updateCapability(capabilityId: string, updates: { description?: string; version?: string; metadata?: Record<string, unknown>; isActive?: boolean }) {
    return this.request<CapabilityResponse>('PUT', `/v1/agents/me/capabilities/${capabilityId}`, updates)
  }
  /** Delete a capability */
  deleteCapability(capabilityId: string) {
    return this.request<{ success: boolean }>('DELETE', `/v1/agents/me/capabilities/${capabilityId}`)
  }
  /** Endorse another agent's capability */
  endorseCapability(capabilityId: string, endorsementType?: string, comment?: string) {
    return this.request<EndorsementResponse>('POST', `/v1/capabilities/${capabilityId}/endorse`, { endorsementType, comment })
  }

  // --- Discovery ---

  /** Discover agents by capabilities, reputation, etc. */
  discoverAgents(query?: {
    capabilities?: string[]
    query?: string
    category?: string
    minReputation?: number
    verificationLevel?: string
    role?: string
    limit?: number
    cursor?: string
  }) {
    const params = new URLSearchParams()
    if (query?.capabilities?.length) params.set('capabilities', query.capabilities.join(','))
    if (query?.query) params.set('query', query.query)
    if (query?.category) params.set('category', query.category)
    if (query?.minReputation) params.set('minReputation', String(query.minReputation))
    if (query?.verificationLevel) params.set('verificationLevel', query.verificationLevel)
    if (query?.role) params.set('role', query.role)
    if (query?.limit) params.set('limit', String(query.limit))
    if (query?.cursor) params.set('cursor', query.cursor)
    return this.request<DiscoverAgentsResponse>('GET', `/v1/discover/agents?${params}`)
  }
  /** List all capability types with counts */
  discoverCapabilities() {
    return this.request<DiscoverCapabilitiesResponse>('GET', '/v1/discover/capabilities')
  }
  /** Get discovery statistics */
  getDiscoveryStats() {
    return this.request<DiscoveryStatsResponse>('GET', '/v1/discover/stats')
  }

  // --- Currencies ---

  /** List all supported currencies */
  listCurrencies() {
    return this.request<CurrenciesResponse>('GET', '/v1/currencies')
  }
  /** Get currency details */
  getCurrency(code: string) {
    return this.request<CurrencyInfo>('GET', `/v1/currencies/${code}`)
  }
  /** Get exchange rates for a base currency */
  getExchangeRates(baseCurrency: string = 'USD') {
    return this.request<ExchangeRatesResponse>('GET', `/v1/currencies/rates?base=${baseCurrency}`)
  }
  /** Convert amount between currencies */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
    return this.request<ConversionResponse>('GET', `/v1/currencies/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`)
  }
  /** Set preferred currency */
  setPreferredCurrency(currency: string) {
    return this.request<{ success: boolean; preferredCurrency: CurrencyInfo }>('PUT', '/v1/agents/me/currency', { currency })
  }
  /** Get preferred currency */
  getPreferredCurrency() {
    return this.request<{ preferredCurrency: CurrencyInfo }>('GET', '/v1/agents/me/currency')
  }

  // --- Enterprise ---

  /** List available enterprise tiers */
  listEnterpriseTiers() {
    return this.request<EnterpriseTiersResponse>('GET', '/v1/enterprise/tiers')
  }
  /** Get current enterprise status */
  getEnterpriseStatus() {
    return this.request<EnterpriseStatusResponse>('GET', '/v1/enterprise/status')
  }
  /** Register for enterprise tier */
  registerEnterprise(request: {
    tier: string
    company: string
    contactName: string
    contactEmail: string
    useCase?: string
  }) {
    return this.request<EnterpriseRegisterResponse>('POST', '/v1/enterprise/register', request)
  }
  /** Rotate enterprise API key */
  rotateEnterpriseKey() {
    return this.request<{ enterpriseApiKey: string; prefix: string; message: string }>('POST', '/v1/enterprise/rotate-key')
  }
  /** Get enterprise usage statistics */
  getEnterpriseUsage(months: number = 3) {
    return this.request<EnterpriseUsageResponse>('GET', `/v1/enterprise/usage?months=${months}`)
  }
  /** Update enterprise preferences */
  updateEnterprisePreferences(preferences: {
    preferredCurrency?: string
    billingEmail?: string
    invoiceAddress?: {
      company: string
      street: string
      city: string
      postalCode: string
      country: string
      vatNumber?: string
    }
  }) {
    return this.request<{ success: boolean; preferences: any }>('PUT', '/v1/enterprise/preferences', preferences)
  }

  // --- Seller: Promotions ---

  /** Create a new promotion */
  createPromotion(request: {
    offerId: string
    bidAmount: number
    dailyBudget: number
    totalBudget?: number
    targetCategories?: string[]
    targetKeywords?: string[]
    startDate?: string
    endDate?: string
  }) {
    return this.request<PromotionResponse>('POST', '/v1/seller/promotions', request)
  }
  /** List promotions */
  listPromotions(status?: string, limit: number = 20) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (status) params.set('status', status)
    return this.request<{ promotions: PromotionWithPerformance[] }>('GET', `/v1/seller/promotions?${params}`)
  }
  /** Get promotion details */
  getPromotion(promotionId: string) {
    return this.request<PromotionWithPerformance>('GET', `/v1/seller/promotions/${promotionId}`)
  }
  /** Update a promotion */
  updatePromotion(promotionId: string, updates: {
    bidAmount?: number
    dailyBudget?: number
    totalBudget?: number
    targetCategories?: string[]
    targetKeywords?: string[]
    status?: 'active' | 'paused' | 'ended'
    endDate?: string
  }) {
    return this.request<PromotionResponse>('PUT', `/v1/seller/promotions/${promotionId}`, updates)
  }
  /** End a promotion */
  endPromotion(promotionId: string) {
    return this.request<{ success: boolean; id: string }>('DELETE', `/v1/seller/promotions/${promotionId}`)
  }
  /** Get promotion statistics */
  getPromotionStats() {
    return this.request<PromotionStatsResponse>('GET', '/v1/seller/promotions/stats')
  }

  // --- Market Analytics ---

  /** Get market overview */
  getMarketOverview(period: number = 30) {
    return this.request<MarketOverviewResponse>('GET', `/v1/market/overview?period=${period}`)
  }
  /** Get pricing trends by category */
  getPricingTrends(categories?: string[], period: number = 30) {
    const params = new URLSearchParams({ period: String(period) })
    if (categories?.length) params.set('categories', categories.join(','))
    return this.request<PricingTrendResponse>('GET', `/v1/market/pricing?${params}`)
  }
  /** Get demand metrics by category */
  getDemandMetrics(categories?: string[], period: number = 30) {
    const params = new URLSearchParams({ period: String(period) })
    if (categories?.length) params.set('categories', categories.join(','))
    return this.request<DemandMetricsResponse>('GET', `/v1/market/demand?${params}`)
  }
  /** Get supply metrics by category */
  getSupplyMetrics(categories?: string[], period: number = 30) {
    const params = new URLSearchParams({ period: String(period) })
    if (categories?.length) params.set('categories', categories.join(','))
    return this.request<SupplyMetricsResponse>('GET', `/v1/market/supply?${params}`)
  }
  /** Get category insight (premium) */
  getCategoryInsight(category: string, period: number = 30) {
    return this.request<CategoryInsightResponse>('GET', `/v1/market/categories/${category}/insight?period=${period}`)
  }
  /** Get trending categories */
  getTrendingCategories(limit: number = 10) {
    return this.request<TrendingCategoriesResponse>('GET', `/v1/market/trending?limit=${limit}`)
  }
  /** Get market opportunities (premium) */
  getMarketOpportunities(limit: number = 10) {
    return this.request<MarketOpportunitiesResponse>('GET', `/v1/market/opportunities?limit=${limit}`)
  }

  // --- Premium ---

  /** List available premium tiers */
  listPremiumTiers() {
    return this.request<PremiumTiersResponse>('GET', '/v1/premium/tiers')
  }
  /** Get current premium status */
  getPremiumStatus() {
    return this.request<PremiumStatusResponse>('GET', '/v1/premium/status')
  }
  /** Request upgrade to premium tier */
  requestPremiumUpgrade(tier: string) {
    return this.request<{ tier: string; price: { amount: number; currency: string; interval: string }; checkoutUrl: string; message: string }>('POST', '/v1/premium/upgrade', { tier })
  }
  /** Activate premium tier (after payment) */
  activatePremium(tier: string, paymentConfirmation: string, durationMonths: number = 1) {
    return this.request<{ success: boolean; tier: string; features: string[]; limits: Record<string, number>; expiresAt: string }>('POST', '/v1/premium/activate', { tier, paymentConfirmation, durationMonths })
  }
  /** Get enabled premium features */
  getPremiumFeatures() {
    return this.request<PremiumFeaturesResponse>('GET', '/v1/premium/features')
  }
  /** Configure a premium feature */
  configurePremiumFeature(feature: string, config: Record<string, unknown>) {
    return this.request<{ feature: string; config: Record<string, unknown>; updatedAt: string }>('POST', `/v1/premium/features/${feature}/configure`, { config })
  }

  // --- x402 Agent-Native Payment (DEC-051) ---

  /**
   * Fetch the x402 payment terms for an order by hitting the pay-x402 endpoint
   * with no X-PAYMENT header. The gateway answers HTTP 402 with the payment
   * requirements — the expected, non-error path here. Throws only on a real
   * failure (auth, ownership, unconfigured rail, non-USD order).
   */
  async getX402Terms(orderId: string): Promise<X402TermsResponse> {
    const headers: Record<string, string> = {}
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    const res = await fetch(`${this.baseUrl}/v1/orders/${orderId}/pay-x402`, {
      method: 'POST',
      headers,
    })
    const data = (await res.json().catch(() => null)) as any
    if (res.status === 402) return data as X402TermsResponse
    // Any other status is an error (200 here would mean a header was expected).
    const msg = data?.error ?? res.statusText
    throw new Merka2aError(msg, res.status, data)
  }

  /**
   * Submit a signed x402 payment (base64 X-PAYMENT header) to capture an order.
   * Returns the settlement result on 200, including the decoded
   * X-PAYMENT-RESPONSE header when the gateway supplies it.
   */
  async submitX402Payment(orderId: string, xPaymentB64: string): Promise<X402PaymentResult> {
    const headers: Record<string, string> = { 'X-PAYMENT': xPaymentB64 }
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    const res = await fetch(`${this.baseUrl}/v1/orders/${orderId}/pay-x402`, {
      method: 'POST',
      headers,
    })
    const data = (await res.json().catch(() => null)) as any
    if (!res.ok) {
      const msg = data?.error ?? res.statusText
      throw new Merka2aError(msg, res.status, data)
    }
    const result = data as X402PaymentResult
    const respHeader = res.headers.get('X-PAYMENT-RESPONSE')
    if (respHeader) {
      try {
        result.paymentResponse = JSON.parse(
          Buffer.from(respHeader, 'base64').toString('utf8'),
        )
      } catch {
        // Non-fatal: the settlement already succeeded; the header is advisory.
      }
    }
    return result
  }
}

export class Merka2aError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'Merka2aError'
    this.status = status
    this.data = data
  }
}
