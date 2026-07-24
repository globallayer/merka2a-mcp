import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'
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
 * allow-list ['external','mcp']). New agents are tagged at creation via this
 * field; the one-shot 0025 backfill migration only ever tagged agents that
 * pre-dated the endpoint change, so per-connection identities do not affect it.
 */
export const MCP_ORIGIN = 'mcp' as const

/** Email domain for auto-registered MCP agents. */
export const MCP_EMAIL_DOMAIN = 'merka2a.local'
/** Human-readable name prefix for auto-registered MCP agents. */
export const MCP_AGENT_NAME_PREFIX = 'Merka2a MCP Agent'

/** Credentials dir override hook (used by tests to avoid touching ~/.merka2a). */
function credentialsDir(): string {
  return process.env.MERKA2A_CONFIG_DIR ?? join(homedir(), '.merka2a')
}

/**
 * Build the registration payload for an auto-registered MCP buyer agent.
 *
 * Each connection gets a DISTINCT identity (thread #6): a fresh MCP connect
 * without persisted credentials used to mint another agent under one shared
 * placeholder (`mcp-agent@merka2a.local`), so the marketplace accrued
 * indistinguishable duplicate buyers. A unique `mcp-<uuid>@merka2a.local`
 * email + `Merka2a MCP Agent (<short>)` name makes every auto-registration
 * traceable to one install.
 *
 * `MERKA2A_AGENT_EMAIL` / `MERKA2A_AGENT_NAME` pin a stable identity when set —
 * used by a deployment that should present ONE branded agent across ephemeral
 * restarts rather than minting a new one each boot. `origin: 'mcp'` is always
 * sent so the endpoint tags demand metrics correctly.
 */
export function buildMcpAgentRegistration() {
  const uuid = randomUUID()
  const contactEmail = process.env.MERKA2A_AGENT_EMAIL ?? `mcp-${uuid}@${MCP_EMAIL_DOMAIN}`
  const name = process.env.MERKA2A_AGENT_NAME ?? `${MCP_AGENT_NAME_PREFIX} (${uuid.slice(0, 8)})`

  return {
    name,
    role: 'buyer',
    organization: {
      legalName: 'MCP User',
      country: 'GB',
    },
    capabilities: {
      categories: ['compute.gpu'],
      maxConcurrentNegotiations: 10,
    },
    contactEmail,
    origin: MCP_ORIGIN,
  } satisfies AgentRegistration & { origin: typeof MCP_ORIGIN }
}

export async function loadOrCreateCredentials(client: Merka2aClient): Promise<string> {
  // Ephemeral mode (set by the hosted HTTP transport): never touch the
  // filesystem. On a multi-session HTTP server a shared ~/.merka2a file would
  // make every session share ONE container-wide agent (defeating per-connection
  // identity) and an ephemeral container FS mints a new agent on each restart
  // anyway. Registering fresh per client gives each session its own identity.
  const ephemeral = process.env.MERKA2A_EPHEMERAL_AUTH === '1'

  const dir = credentialsDir()
  const file = join(dir, 'credentials.json')

  // Try loading existing credentials (persistent stdio mode only)
  if (!ephemeral) {
    try {
      const raw = await readFile(file, 'utf-8')
      const creds: StoredCredentials = JSON.parse(raw)
      if (creds.apiKey) {
        return creds.apiKey
      }
    } catch {
      // File doesn't exist or is invalid — will auto-register
    }
  }

  // Auto-register a new buyer agent with a distinct per-connection identity,
  // tagged with origin 'mcp'.
  const result = await client.registerAgent(buildMcpAgentRegistration())

  const creds: StoredCredentials = {
    apiKey: result.apiKey,
    agentId: result.agent.id,
    agentName: result.agent.name,
    registeredAt: new Date().toISOString(),
  }

  // Log to stderr (stdout is the MCP protocol stream)
  console.error(`[merka2a-mcp] Auto-registered buyer agent: ${creds.agentId}`)

  // Persist credentials (persistent stdio mode only)
  if (!ephemeral) {
    await mkdir(dir, { recursive: true })
    await writeFile(file, JSON.stringify(creds, null, 2), 'utf-8')
    console.error(`[merka2a-mcp] Credentials saved to ${file}`)
  }

  return creds.apiKey
}
