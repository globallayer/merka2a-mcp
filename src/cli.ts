#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

async function main() {
  const server = await createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[merka2a-mcp] MCP server running on stdio')
}

main().catch((err) => {
  console.error('[merka2a-mcp] Failed to start:', err)
  process.exit(1)
})
