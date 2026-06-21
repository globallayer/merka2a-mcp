import { Merka2aClient } from '@merk.a2a/sdk'
import { loadOrCreateCredentials } from './auth.js'

const DEFAULT_API_URL = 'https://pretty-nurturing-production.up.railway.app'

export async function createAuthenticatedClient(): Promise<Merka2aClient> {
  const baseUrl = process.env.MERKA2A_API_URL ?? DEFAULT_API_URL
  const client = new Merka2aClient({ baseUrl })

  let apiKey = process.env.MERKA2A_API_KEY
  if (!apiKey) {
    apiKey = await loadOrCreateCredentials(client)
  }

  client.setApiKey(apiKey)
  console.error(`[merka2a-mcp] Connected to ${baseUrl}`)
  return client
}
