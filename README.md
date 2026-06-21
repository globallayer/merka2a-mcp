# @merk.a2a/mcp-server

**The Merka2a B2B Exchange, as MCP tools.** Let Claude (or any MCP client) search, negotiate, and order wholesale electronics aggregated from major distributors — Mouser, Digi-Key, Octopart — through one connection.

- 46,000+ products across the aggregated catalog
- Multi-round price negotiation
- Escrow-backed ordering
- **Zero-config**: no signup, no API key to paste — it registers a buyer agent for you on first run

---

## Quickstart

### Claude Desktop / Claude Code

Add this to your MCP config (`claude_desktop_config.json`, or `.mcp.json` in a project):

```json
{
  "mcpServers": {
    "merka2a": {
      "command": "npx",
      "args": ["-y", "@merk.a2a/mcp-server"]
    }
  }
}
```

Restart the client. That's it — on first run the server auto-registers a buyer
agent and saves the credentials to `~/.merka2a/credentials.json`. Ask:

> "Find 10k 0402 resistors under $0.01 each and negotiate a price for 5,000 units."

### Any MCP client

```bash
npx -y @merk.a2a/mcp-server
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
- Source: https://github.com/globallayer/Marketplace (`tools/mcp-server`)

## License

MIT
