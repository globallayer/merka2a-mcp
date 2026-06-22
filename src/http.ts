import { createServer as createHttpServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { createServer } from './server.js'

/**
 * Streamable HTTP entry point for the Merka2a MCP server.
 *
 * The stdio entry (cli.ts) is what npx users run locally; this entry exposes
 * the same tools over a public HTTP URL so registry scanners (Smithery, Glama)
 * can connect, introspect tools, and score the listing. A stdio bundle alone is
 * never scanned — only a reachable Streamable HTTP deployment is.
 *
 * Each MCP session gets its own McpServer + lazy client (see createServer), so
 * concurrent agents never share authentication state.
 */

const PORT = Number(process.env.PORT ?? 8081)
const MCP_PATH = '/mcp'

// Active sessions keyed by the Mcp-Session-Id assigned at initialize time.
const transports = new Map<string, StreamableHTTPServerTransport>()

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk as Buffer))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (raw.length === 0) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

function jsonRpcError(message: string): unknown {
  return { jsonrpc: '2.0', error: { code: -32000, message }, id: null }
}

async function handleInitializeOrPost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req)
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  let transport = sessionId ? transports.get(sessionId) : undefined

  if (!transport) {
    // A new session may only be opened by an `initialize` request without a
    // pre-existing session id. Anything else is a protocol violation.
    if (sessionId !== undefined || !isInitializeRequest(body)) {
      writeJson(res, 400, jsonRpcError('Bad Request: no valid session for non-initialize request'))
      return
    }

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports.set(sid, transport as StreamableHTTPServerTransport)
      },
    })
    transport.onclose = () => {
      const sid = transport?.sessionId
      if (sid) transports.delete(sid)
    }

    const server = await createServer()
    await server.connect(transport)
  }

  await transport.handleRequest(req, res, body)
}

async function handleSessionRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined
  const transport = sessionId ? transports.get(sessionId) : undefined
  if (!transport) {
    writeJson(res, 400, jsonRpcError('Invalid or missing session id'))
    return
  }
  await transport.handleRequest(req, res)
}

const httpServer = createHttpServer((req, res) => {
  // Permissive CORS so browser-based MCP clients (e.g. the MCP Inspector) work;
  // the session id header must be exposed so clients can read it on initialize.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version')
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  void (async () => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204).end()
        return
      }

      if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
        writeJson(res, 200, {
          status: 'ok',
          service: 'merka2a-mcp-http',
          transport: 'streamable-http',
          endpoint: MCP_PATH,
          sessions: transports.size,
        })
        return
      }

      if (url.pathname !== MCP_PATH) {
        writeJson(res, 404, { error: 'Not found' })
        return
      }

      if (req.method === 'POST') {
        await handleInitializeOrPost(req, res)
        return
      }
      if (req.method === 'GET' || req.method === 'DELETE') {
        await handleSessionRequest(req, res)
        return
      }

      writeJson(res, 405, { error: 'Method not allowed' })
    } catch (err) {
      console.error('[merka2a-mcp-http] request error:', err)
      if (!res.headersSent) {
        writeJson(res, 500, jsonRpcError('Internal server error'))
      }
    }
  })()
})

httpServer.listen(PORT, () => {
  console.error(`[merka2a-mcp-http] Streamable HTTP MCP server listening on :${PORT}${MCP_PATH}`)
})
