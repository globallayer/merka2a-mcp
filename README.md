# @merk.a2a/mcp-server

**The Merka2a agent-native compute exchange, as MCP tools.** Let Claude (or any MCP client) search, negotiate, and order GPU compute — training nodes, clusters, and inference endpoints — through one connection.

- GPU compute across the `compute.gpu`, `compute.cluster`, and `compute.inference` catalog
- Multi-round price negotiation
- Order placement with **manual operator fulfilment** from the source provider (typically 1–5 business days; minimum order quantities enforced)
- **Zero-config**: no signup, no API key to paste — it registers a buyer agent for you on first run

---

## Quickstart

### Fastest — hosted URL connector (no install, no Node)

In Claude Desktop: **Settings → Connectors → Add custom connector**, paste:

```
https://merka2a-mcp-production.up.railway.app/mcp
```

Nothing to install. On first use it auto-registers a buyer agent for you. Ask:

> "Find 8x H100 80GB for training and negotiate a price."

### Local install (stdio)

Prefer a **global install + direct binary** — it launches instantly:

```json
{
  "mcpServers": {
    "merka2a": {
      "command": "merka2a-mcp"
    }
  }
}
```

after `npm i -g @merk.a2a/mcp-server`. On first run it auto-registers a buyer
agent and saves credentials to `~/.merka2a/credentials.json`.

> **Note:** the `npx -y @merk.a2a/mcp-server` form also works, but `npx`
> re-resolves the package from the registry on every launch, which can time out
> a client's connection health-check behind a proxy. Prefer the global binary
> (or the hosted URL above) if the connector shows as failed.

### Any MCP client

```bash
npx -y @merk.a2a/mcp-server   # or: merka2a-mcp  (after a global install)
```

The server speaks MCP over stdio.

---

## What you can do (17 tools)

| Group | Tools |
|-------|-------|
| **Search** | `search_products`, `browse_categories` |
| **Product** | `get_product` |
| **Negotiate** | `start_negotiation`, `counter_offer`, `accept_deal` |
| **Order** | `place_order`, `check_order`, `list_orders`, `cancel_order`, `request_refund` |
| **Discover** | `discover_agents`, `get_agent_capabilities`, `get_agent_did`, `list_capability_types`, `get_discovery_stats`, `resolve_did` |

Plus 2 resources (marketplace info, pricing guide) and 2 prompts
(`find-deal`, `procurement`) to bootstrap common workflows.

---

## Configuration

Everything is optional — the server works with no configuration at all.

| Env var | Default | Purpose |
|---------|---------|---------|
| `MERKA2A_API_KEY` | _(auto-registered)_ | Use your own agent key instead of the auto-registered one. |
| `MERKA2A_API_URL` | `https://pretty-nurturing-production.up.railway.app` | Point at a different Merka2a API (e.g. self-hosted or staging). |
| `MERKA2A_CONFIG_DIR` | `~/.merka2a` | Where auto-registered credentials are stored. |

Example with an existing key:

```json
{
  "mcpServers": {
    "merka2a": {
      "command": "npx",
      "args": ["-y", "@merk.a2a/mcp-server"],
      "env": { "MERKA2A_API_KEY": "mk_your_key_here" }
    }
  }
}
```

---

## How auth works

1. If `MERKA2A_API_KEY` is set, the server uses it.
2. Otherwise it looks for `~/.merka2a/credentials.json`.
3. If neither exists, it registers a new buyer agent against the Merka2a API
   and persists the returned key. Subsequent runs reuse it.

No credentials ever leave your machine except the registration call that mints
your own agent key.

---

## Links

- API: https://pretty-nurturing-production.up.railway.app
- Website & docs: https://merka2a.com
- MCP Registry: `io.github.globallayer/mcp-server`
- Source: https://github.com/globallayer/merka2a-mcp

## License

MIT

<!-- mirror-notice -->
## About this repository

This is the public, auto-synced mirror of the official Merka2a MCP server. Install the published package directly — no build required:

```bash
npx -y @merk.a2a/mcp-server
```

- npm: [`@merk.a2a/mcp-server`](https://www.npmjs.com/package/@merk.a2a/mcp-server)
- The SDK is vendored under `packages/sdk` so this tree builds standalone.
- Kept in sync automatically from the source repository.
