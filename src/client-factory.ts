import { Merka2aClient } from '@merk.a2a/sdk'
import { loadOrCreateCredentials } from './auth.js'

export const DEFAULT_API_URL = 'https://pretty-nurturing-production.up.railway.app'

/**
 * How the client ended up authenticated — surfaced on the HTTP server's /health
 * so a stale/invalid MERKA2A_API_KEY (which once silently 401'd every call and
 * left zero agents registered) is visible in one curl instead of a dead buy-path.
 */
export type AuthMode =
  | 'unauthenticated'        // not yet resolved
  | 'env-key-valid'          // MERKA2A_API_KEY set and validated via getMe()
  | 'env-key-invalid-fallback' // MERKA2A_API_KEY set but rejected → auto-registered instead
  | 'auto-registered'        // no env key → auto-registered a buyer agent

let lastAuthMode: AuthMode = 'unauthenticated'
export function getAuthMode(): AuthMode { return lastAuthMode }

/**
 * Resolve the API key. A configured MERKA2A_API_KEY is VALIDATED before use:
 * a stale key must never poison every call (root cause of the F9 outage — the
 * hosted deployment carried an invalidated key that both short-circuited
 * auto-registration and 401'd everything). If validation fails we log loudly
 * and fall back to auto-registration so the buy-path stays alive.
 */
async function resolveApiKey(client: Merka2aClient): Promise<string> {
  const envKey = process.env.MERKA2A_API_KEY
  if (envKey) {
    client.setApiKey(envKey)
    try {
      await client.getMe()
      lastAuthMode = 'env-key-valid'
      return envKey
    } catch (err) {
      console.error(
        '[merka2a-mcp] Configured MERKA2A_API_KEY is INVALID — falling back to auto-registration:',
        err instanceof Error ? err.message : err,
      )
      const key = await loadOrCreateCredentials(client)
      lastAuthMode = 'env-key-invalid-fallback'
      return key
    }
  }
  const key = await loadOrCreateCredentials(client)
  lastAuthMode = 'auto-registered'
  return key
}

/**
 * Build a Merka2a client that authenticates lazily, on the first API call,
 * rather than at server startup.
 *
 * Startup must not perform network I/O: MCP clients and registry inspectors
 * (Glama, Smithery) start the server and list its tools without any network
 * access. Doing auto-registration at boot made the process crash offline, so
 * the server was flagged "cannot be installed". Here the server starts
 * immediately and advertises its tools; credentials are resolved (or an agent
 * auto-registered) the first time a tool actually calls the API. A failed
 * attempt is not cached, so the next call retries.
 */
export function createAuthenticatedClient(): Merka2aClient {
  const baseUrl = process.env.MERKA2A_API_URL ?? DEFAULT_API_URL
  const client = new Merka2aClient({ baseUrl })

  let authPromise: Promise<void> | undefined
  const ensureAuth = (): Promise<void> => {
    if (!authPromise) {
      authPromise = (async () => {
        const apiKey = await resolveApiKey(client)
        client.setApiKey(apiKey)
        console.error(`[merka2a-mcp] Authenticated against ${baseUrl} (${lastAuthMode})`)
      })().catch((err) => {
        authPromise = undefined // allow retry on the next call
        lastAuthMode = 'unauthenticated'
        throw err
      })
    }
    return authPromise
  }

  // Transparent proxy: every async API method waits for authentication first.
  // loadOrCreateCredentials/registerAgent run against the raw `client`, so they
  // do not recurse through this proxy.
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]) => {
        await ensureAuth()
        return (value as (...a: unknown[]) => unknown).apply(target, args)
      }
    },
  })
}
