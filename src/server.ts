import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createAuthenticatedClient } from './client-factory.js'
import { registerSearchTools } from './tools/search.js'
import { registerProductTools } from './tools/product.js'
import { registerNegotiationTools } from './tools/negotiation.js'
import { registerOrderTools } from './tools/orders.js'
import { registerDiscoveryTools } from './tools/discovery.js'
import { registerMarketplaceInfoResource } from './resources/marketplace-info.js'
import { registerPricingGuideResource } from './resources/pricing-guide.js'
import { registerFindDealPrompt } from './prompts/find-deal.js'
import { registerProcurementPrompt } from './prompts/procurement.js'

export async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: 'merka2a',
    version: '1.0.5',
  })

  const client = createAuthenticatedClient()

  // Register tools (11 total)
  registerSearchTools(server, client)       // search_products, browse_categories
  registerProductTools(server, client)      // get_product
  registerNegotiationTools(server, client)  // start_negotiation, counter_offer, accept_deal
  registerOrderTools(server, client)        // place_order, check_order, list_orders, cancel_order, request_refund
  registerDiscoveryTools(server, client)    // discover_agents, get_agent_capabilities, get_agent_did, list_capability_types, get_discovery_stats, resolve_did

  // Register resources (2)
  registerMarketplaceInfoResource(server, client)
  registerPricingGuideResource(server)

  // Register prompts (2)
  registerFindDealPrompt(server)
  registerProcurementPrompt(server)

  console.error('[merka2a-mcp] Server initialized with 17 tools, 2 resources, 2 prompts')
  return server
}
