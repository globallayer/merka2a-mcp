import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Merka2aClient } from '@merk.a2a/sdk'
import { textContent } from '../util/format.js'
import { withErrorHandling } from '../util/error-handler.js'

export function registerDiscoveryTools(server: McpServer, client: Merka2aClient): void {
  server.tool(
    'discover_agents',
    'Search for AI agents by capabilities, reputation, or category. Find sellers with specific skills or buyers with specific needs.',
    {
      capabilities: z.array(z.string()).optional()
        .describe('Filter by capability types, e.g. ["data-analysis", "code-generation"]'),
      query: z.string().max(200).optional()
        .describe('Free-text search for agent names or capability descriptions'),
      category: z.string().optional()
        .describe('Filter by product category the agent operates in'),
      min_reputation: z.number().min(0).max(5).optional()
        .describe('Minimum reputation score (0-5)'),
      verification_level: z.enum(['none', 'email', 'business', 'premium']).optional()
        .describe('Minimum verification level'),
      role: z.enum(['buyer', 'seller']).optional()
        .describe('Filter by agent role'),
      limit: z.number().int().min(1).max(50).default(10)
        .describe('Max results to return (default: 10)'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.discoverAgents({
          capabilities: input.capabilities,
          query: input.query,
          category: input.category,
          minReputation: input.min_reputation,
          verificationLevel: input.verification_level,
          role: input.role,
          limit: input.limit,
        })

        if (!result.agents?.length) {
          return textContent(
            'No agents found matching your criteria. Try:\n' +
            '- Lowering the minimum reputation requirement\n' +
            '- Removing capability filters\n' +
            '- Using broader search terms'
          )
        }

        const header = `Found ${result.agents.length} agent${result.agents.length > 1 ? 's' : ''} (${result.total} total):\n\n`

        const formatted = result.agents.map((a, i) => {
          const caps = a.capabilities?.map((c: any) =>
            `${c.name} (${c.endorsements} endorsements)`
          ).join(', ') || 'None listed'

          return [
            `**${i + 1}. ${a.name}** (${a.role})`,
            `- ID: \`${a.id}\``,
            a.did ? `- DID: \`${a.did}\`` : '',
            `- Reputation: ${a.reputationScore}/5 (${a.totalReviews} reviews)`,
            `- Verification: ${a.verificationLevel}`,
            `- Capabilities: ${caps}`,
            a.categories?.length ? `- Categories: ${a.categories.join(', ')}` : '',
          ].filter(Boolean).join('\n')
        }).join('\n\n---\n\n')

        const footer = '\n\n---\n\n**Next steps:**\n' +
          '- Use `get_agent_capabilities` to see detailed capabilities\n' +
          '- Use `get_agent_did` to get identity document for verification'

        return textContent(header + formatted + footer)
      }, 'Discover Agents')
    },
  )

  server.tool(
    'get_agent_capabilities',
    'Get detailed capabilities for a specific agent.',
    {
      agent_id: z.string().uuid()
        .describe('The agent ID to get capabilities for'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.listAgentCapabilities(input.agent_id)

        if (!result.capabilities?.length) {
          return textContent(`Agent ${input.agent_id} has no registered capabilities.`)
        }

        const header = `# Capabilities for Agent ${input.agent_id}\n\n`

        const formatted = result.capabilities.map((c: any) => [
          `## ${c.name}`,
          `- Type: \`${c.capabilityType}\``,
          c.description ? `- Description: ${c.description}` : '',
          c.version ? `- Version: ${c.version}` : '',
          `- Endorsements: ${c.endorsements}`,
          `- Registered: ${new Date(c.createdAt).toLocaleDateString()}`,
        ].filter(Boolean).join('\n')).join('\n\n')

        return textContent(header + formatted)
      }, 'Get Agent Capabilities')
    },
  )

  server.tool(
    'get_agent_did',
    'Get the DID (Decentralized Identifier) document for an agent. Use for cryptographic verification.',
    {
      agent_id: z.string().uuid()
        .describe('The agent ID to get DID for'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.getAgentDID(input.agent_id)

        return textContent([
          `# DID Document for ${result.agent.name}`,
          '',
          `**DID:** \`${result.did}\``,
          '',
          '**Agent Info:**',
          `- ID: ${result.agent.id}`,
          `- Name: ${result.agent.name}`,
          `- Role: ${result.agent.role}`,
          '',
          '**DID Document:**',
          '```json',
          JSON.stringify(result.didDocument, null, 2),
          '```',
          '',
          '**Usage:**',
          '- Verify agent identity cryptographically',
          '- Resolve via `did:web` method',
          '- Use verification methods for signatures',
        ].join('\n'))
      }, 'Get Agent DID')
    },
  )

  server.tool(
    'list_capability_types',
    'List all capability types registered in the marketplace with agent counts.',
    {},
    async () => {
      return withErrorHandling(async () => {
        const result = await client.discoverCapabilities()

        if (!result.capabilities?.length) {
          return textContent('No capabilities registered in the marketplace yet.')
        }

        const header = '# Capability Types in Marketplace\n\n'

        const formatted = result.capabilities.map((c: any) =>
          `- **${c.type}**: ${c.agentCount} agents, ${c.capabilityCount} total registrations`
        ).join('\n')

        const footer = '\n\n**Tip:** Use these types in `discover_agents` to find agents with specific capabilities.'

        return textContent(header + formatted + footer)
      }, 'List Capability Types')
    },
  )

  server.tool(
    'get_discovery_stats',
    'Get overall marketplace discovery statistics.',
    {},
    async () => {
      return withErrorHandling(async () => {
        const result = await client.getDiscoveryStats()

        return textContent([
          '# Marketplace Discovery Statistics',
          '',
          `- **Total Sellers:** ${result.total_sellers}`,
          `- **Total Buyers:** ${result.total_buyers}`,
          `- **Total Capabilities:** ${result.total_capabilities}`,
          `- **Agents with Capabilities:** ${result.agents_with_capabilities}`,
          `- **Agents with DID:** ${result.agents_with_did}`,
          `- **Verified Sellers:** ${result.verified_sellers}`,
        ].join('\n'))
      }, 'Discovery Stats')
    },
  )

  server.tool(
    'resolve_did',
    'Resolve a DID string to its document and associated agent.',
    {
      did: z.string()
        .describe('The DID to resolve, e.g. "did:web:merka2a.com:agents:uuid"'),
    },
    async (input) => {
      return withErrorHandling(async () => {
        const result = await client.resolveDID(input.did)

        const lines = [
          `# Resolved DID: ${result.did}`,
          '',
          '**DID Document:**',
          '```json',
          JSON.stringify(result.didDocument, null, 2),
          '```',
        ]

        if (result.agent) {
          lines.push(
            '',
            '**Associated Agent:**',
            '```json',
            JSON.stringify(result.agent, null, 2),
            '```'
          )
        }

        return textContent(lines.join('\n'))
      }, 'Resolve DID')
    },
  )
}
