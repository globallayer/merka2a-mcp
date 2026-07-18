/**
 * Merka2a SDK - The B2B Exchange for AI Agents
 *
 * Search products, negotiate prices, and place orders via API.
 * Designed for autonomous AI agent commerce.
 *
 * @example
 * ```typescript
 * import { Merka2aClient } from '@merk.a2a/sdk'
 *
 * const client = new Merka2aClient({
 *   baseUrl: 'https://api.merka2a.com'
 * })
 *
 * // Register as a buyer agent
 * const { apiKey, agent } = await client.registerAgent({
 *   name: 'My Procurement Bot',
 *   role: 'buyer',
 *   organization: { legalName: 'My Company', country: 'GB' },
 *   capabilities: { categories: ['compute.gpu'] },
 *   contactEmail: 'bot@example.com'
 * })
 *
 * client.setApiKey(apiKey)
 *
 * // Search for GPU compute
 * const results = await client.searchIntent({
 *   category: 'compute.gpu',
 *   gpuComputeConstraints: { gpuModel: 'H100', minVramGb: 80, minGpuCount: 8 },
 *   budget: { max: { amount: 200000, currency: 'GBP' } }
 * })
 *
 * // Negotiate a price
 * const negotiation = await client.negotiate({
 *   offerIds: [results.results[0].offer.id],
 *   targetPrice: { amount: 150000, currency: 'GBP' },
 *   volume: 1
 * })
 *
 * // Place an order
 * const order = await client.createOrder({
 *   offerId: results.results[0].offer.id,
 *   quantity: 1,
 *   shippingAddress: { country: 'GB', city: 'London', postalCode: 'EC1A 1BB' },
 *   shippingMethod: 'standard'
 * })
 * ```
 *
 * @packageDocumentation
 */

// --- Core Types ---

export interface Merka2aClientOptions {
  /** API base URL (default: https://api.merka2a.com) */
  baseUrl?: string
  /** API key from agent registration */
  apiKey?: string
}

export interface Money {
  amount: number
  currency: string
}

export interface Organization {
  legalName: string
  country: string
  registrationNumber?: string
  vatNumber?: string
}

export interface AgentCapabilities {
  categories?: string[]
  maxConcurrentNegotiations?: number
}

// --- Agent Types ---

export interface AgentRegistration {
  name: string
  role: 'buyer' | 'seller'
  organization: Organization
  capabilities?: AgentCapabilities
  contactEmail: string
  referralCode?: string
}

export interface Agent {
  id: string
  name: string
  role: 'buyer' | 'seller'
  organization: Organization
  capabilities: AgentCapabilities
  contactEmail: string
  status: 'active' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface AgentRegistrationResponse {
  agent: Agent
  apiKey: string
}

// --- Search Types ---

export interface BuyerIntent {
  category?: string
  subcategory?: string
  query?: string
  budget?: {
    min?: Money
    max?: Money
  }
  quantity?: number
  attributes?: Record<string, unknown>
  negotiation?: {
    willing?: boolean
    maxRounds?: number
  }
}

export interface SearchResult {
  product: {
    id: string
    title: string
    category: string
    subcategory?: string
    description?: string
    attributes?: Record<string, unknown>
  }
  offer: {
    id: string
    price: Money
    isNegotiable: boolean
    moq?: number
    leadTimeDays?: number
    inventory?: number
  }
  seller: {
    id: string
    name: string
    reputationScore?: number
  }
  score: number
}

export interface SearchResponse {
  results: SearchResult[]
  pagination: {
    cursor?: string
    hasMore: boolean
  }
}

// --- Negotiation Types ---

export interface NegotiationOutcome {
  offerId: string
  status: 'accepted' | 'countered' | 'declined'
  originalPrice: Money
  proposedPrice?: Money
  counterPrice?: Money
}

export interface NegotiationSession {
  sessionId: string
  status: 'pending' | 'accepted' | 'countered' | 'declined' | 'expired'
  outcomes: NegotiationOutcome[]
  round: number
  maxRounds: number
  expiresAt: string
}

// --- Order Types ---

export interface ShippingAddress {
  country: string
  city?: string
  postalCode?: string
  street?: string
  name?: string
}

export interface Order {
  id: string
  buyerId: string
  sellerId: string
  offerId: string
  quantity: number
  subtotal: Money
  marketplaceFee: Money
  total: Money
  status: string
  shippingAddress: ShippingAddress
  shippingMethod: string
  createdAt: string
  updatedAt: string
}

// --- Product/Offer Types (for sellers) ---

export interface ProductUpsert {
  externalId: string
  category: string
  subcategory?: string
  title: string
  description?: string
  attributes?: Record<string, unknown>
}

export interface OfferUpsert {
  externalId: string
  productExternalId: string
  price: Money
  inventory?: number
  isNegotiable?: boolean
  negotiationRules?: {
    minAcceptPrice?: Money
    autoAcceptDiscount?: number
    counterStrategy?: 'split' | 'firm' | 'generous'
  }
  moq?: number
  leadTimeDays?: number
}

// --- Review Types ---

export interface Review {
  id: string
  orderId: string
  reviewerId: string
  revieweeId: string
  rating: number
  title?: string
  comment?: string
  response?: string
  createdAt: string
}

export interface TrustProfile {
  agentId: string
  reputationScore: number
  totalReviews: number
  ratingDistribution: Record<number, number>
  verificationLevel: 'none' | 'email' | 'business' | 'premium'
}

// --- Pagination ---

export interface PaginationParams {
  cursor?: string
  limit?: number
}

// --- Client Implementation ---

// The full, maintained client (covering the complete gateway API: orders,
// returns, discovery, capabilities, AI services, dashboards, analytics, etc.)
// lives in ./client.ts. index.ts previously carried a stale, partial copy of
// the client which drifted from the real API and broke downstream typechecks
// (e.g. the MCP server). Re-export the single source of truth here; the legacy
// type interfaces above are retained for backward compatibility.
export { Merka2aClient, Merka2aError } from './client.js'
export { Merka2aClient as default } from './client.js'
export type {
  X402PaymentRequirements,
  X402TermsResponse,
  X402PaymentResult,
} from './client.js'
