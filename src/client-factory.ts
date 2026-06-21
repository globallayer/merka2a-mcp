import { Merka2aClient } from '@merk.a2a/sdk'
import { loadOrCreateCredentials } from './auth.js'

const DEFAULT_API_URL = 'https://pretty-nurturing-production.up.railway.app'

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
        const apiKey = process.env.MERKA2A_API_KEY ?? (await loadOrCreateCredentials(client))
        client.setApiKey(apiKey)
        console.error(`[merka2a-mcp] Authenticated against ${baseUrl}`)
      })().catch((err) => {
        authPromise = undefined // allow retry on the next call
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
