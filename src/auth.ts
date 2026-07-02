import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Merka2aClient, AgentRegistration } from '@merk.a2a/sdk'

interface StoredCredentials {
  apiKey: string
  agentId: string
  agentName: string
  registeredAt: string
}

/**
 * Origin tag for agents created via the MCP server. Sent on registration so the
 * public endpoint tags this agent 'mcp' at creation time (it honours the public
 * allow-list ['external','mcp']). The 0025 backfill migration tags pre-existing
 * agents 'mcp' by matching the name/contactEmail below; keep them in sync as a
 * belt-and-braces fallback for any agent registered before the endpoint change.
 */
export const MCP_ORIGIN = 'mcp' as const

/** Credentials dir override hook (used by tests to avoid touching ~/.merka2a). */
function credentialsDir(): string {
  return process.env.MERKA2A_CONFIG_DIR ?? join(homedir(), '.merka2a')
}

/**
 * Canonical registration payload for the MCP auto-registered agent.
 *
 * The name + contactEmail here are the exact join keys the 0025 backfill
 * migration uses to tag this agent with origin 'mcp'; keep them in sync.
 * `origin` is sent on registration so the endpoint tags the agent 'mcp' at
 * creation time, independent of the one-shot migration backfill.
 */
export const MCP_AGENT_REGISTRATION = {
  name: 'Merka2a MCP Agent',
  role: 'buyer',
  organization: {
    legalName: 'MCP User',
    country: 'GB',
  },
  capabilities: {
    categories: ['compute.gpu'],
    maxConcurrentNegotiations: 10,
  },
  contactEmail: 'mcp-agent@merka2a.local',
  origin: MCP_ORIGIN,
} satisfies AgentRegistration & { origin: typeof MCP_ORIGIN }

export async function loadOrCreateCredentials(client: Merka2aClient): Promise<string> {
  const dir = credentialsDir()
  const file = join(dir, 'credentials.json')

  // Try loading existing credentials
  try {
    const raw = await readFile(file, 'utf-8')
    const creds: StoredCredentials = JSON.parse(raw)
    if (creds.apiKey) {
      return creds.apiKey
    }
  } catch {
    // File doesn't exist or is invalid — will auto-register
  }

  // Auto-register a new buyer agent, tagged with origin 'mcp'.
  const result = await client.registerAgent(MCP_AGENT_REGISTRATION)

  const creds: StoredCredentials = {
    apiKey: result.apiKey,
    agentId: result.agent.id,
    agentName: result.agent.name,
    registeredAt: new Date().toISOString(),
  }

  // Persist credentials
  await mkdir(dir, { recursive: true })
  await writeFile(file, JSON.stringify(creds, null, 2), 'utf-8')

  // Log to stderr (stdout is the MCP protocol stream)
  console.error(`[merka2a-mcp] Auto-registered buyer agent: ${creds.agentId}`)
  console.error(`[merka2a-mcp] Credentials saved to ${file}`)

  return creds.apiKey
}
