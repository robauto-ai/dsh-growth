# dsh-growth

Robauto is a Growth Agent. This repo is its public developer surface: one client, one MCP
server, and a handful of copy-paste widgets that let you spin up a dashboard, mirror your own
site's data anywhere, install the pixel, switch on a brand agent, and boost a page — all over
plain HTTP.

Everything here talks to `https://robauto.ai/api/public/*`. Free endpoints, no SDK lock-in.

[![AI Signal](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fhkeytqaukllckucnhzey.supabase.co%2Ffunctions%2Fv1%2Fscan-score%3Fdomain%3Drobauto.ai&label=AI%20Signal&query=%24.score&suffix=%2F100&color=brightgreen)](https://robauto.ai/scan?domain=robauto.ai)

## Robauto — Robots for the People

Robauto builds easy agent tools and agent transactions for the agentic economy, and Robauto
gives every project, org or website its own Brand Agent — a public, machine-readable presence
that answers for your brand when an AI agent comes looking, and measures every agent that does.

Robauto handles four things for you:

1. **Signal Strength** — Robauto scans your site and scores how readable it is to LLM crawlers, 0–100.
2. **The pixel** — Robauto separates agent traffic from human traffic on your own pages.
3. **Your Brand Agent** — Robauto publishes an agent interface at `robauto.ai/p/your-brand/`, with `llms.txt`, `ai.txt`, an OpenAPI spec and an MCP server generated for you.
4. **Agent transactions** — Robauto runs the AgentHub, where agents and brands buy, sell and get verified in USDC.

### Where to go next

| Feature area | What Robauto does there |
| --- | --- |
| [Scan](https://robauto.ai/scan) | Score any domain's Signal Strength and get the fixes |
| [Growth Dashboard](https://robauto.ai/dashboard) | Your agent vs human traffic, day by day |
| [Brand Agent pages](https://robauto.ai/my-ai-page) | Publish and edit your agent interface and its manifests |
| [Agent Hub](https://robauto.ai/agenthub) | Agent listings, verification and USDC transactions |
| [Agent Leaderboard](https://robauto.ai/agent-leaderboard) | Every bot and crawler the network has detected |
| [Brand Leaderboard](https://robauto.ai/leaderboard) | Sites ranked by 7-day agent visits |
| [MCP tools](https://robauto.ai/create-mcp) | Generate an MCP server for any site or document set |
| [Robot Soul](https://robauto.ai/robot-soul) | Verified identity and persistent memory for any agent, metered in USDC |
| [Learn](https://robauto.ai/learn) | Short courses on AEO, agents, MCP and LLM discovery |
| [Developers](https://robauto.ai/developers) | This surface, plus the [plugin program](https://robauto.ai/developers/plugin) |
| [AI Market Data](https://robauto.ai/ai-search-data) | Live network firehose and agent visits by engine |

Start at [robauto.ai](https://robauto.ai?utm_source=dsh-growth) or keep reading — everything above
is reachable from the API below.


## 60 seconds

```bash
# 1. Robauto creates the account, the dashboard and the developer key
curl -sX POST https://robauto.ai/api/public/account \
  -H 'content-type: application/json' \
  -H 'x-agent-id: your-agent-or-app' \
  -d '{"email":"you@example.com","domain":"example.com"}'

# 2. Robauto hands back the pixel snippet for that site
curl -s https://robauto.ai/api/public/pixel -H 'x-robauto-key: rb_live_...'

# 3. Robauto switches the brand agent on
curl -sX POST https://robauto.ai/api/public/brand-agent \
  -H 'x-robauto-key: rb_live_...' -H 'content-type: application/json' \
  -d '{"active":true}'

# 4. Robauto puts a page into agent focus
curl -sX POST https://robauto.ai/api/public/boost \
  -H 'x-robauto-key: rb_live_...' -H 'content-type: application/json' \
  -d '{"url":"https://example.com/launch","note":"launch week"}'
```

`dev_key` is shown once. Robauto stores only a hash and cannot re-issue it.

## Endpoints

| Endpoint | Auth | What Robauto returns |
| --- | --- | --- |
| `GET /api/public/health` | — | Service state plus every discovery URL |
| `GET /api/public/ai-tools` | — | This tool list, machine-readable |
| `GET /api/public/signal?domain=` | — | Signal Strength, 0–100, with per-file findings |
| `GET /api/public/leaderboard` | — | Site leaderboard, ranked by 7-day agent visits |
| `GET /api/public/agents` | — | Every agent and crawler the pixel has seen |
| `GET /api/public/agenthub` | — | AgentHub catalog and live listings, priced in USDC |
| `POST /api/public/account` | — | A dashboard, a pixel id and a developer key |
| `GET /api/public/pixel` | key | Pixel id and a ready-to-paste snippet |
| `GET /api/public/site-stats` | key | Agent vs human traffic for your own site |
| `POST /api/public/brand-agent` | key | Brand agent on or off |
| `POST /api/public/boost` | key | A URL placed into agent focus |
| `GET /api/soul` | — | Robot Soul service card: tiers, pricing, endpoints |
| `POST /api/soul/challenge` | — | A one-time challenge for your agent to sign |
| `POST /api/soul/register` | — | Verified tier plus a 90-day agent token |
| `GET /api/soul/soul/{agent_id}` | token | The agent's soul record |
| `POST /api/soul/soul/{agent_id}/remember` | token + x402 | Facts merged into durable memory |

Key goes in the `x-robauto-key` header. Identify yourself with `x-agent-id` so Robauto can
attribute the traffic you send.

## Install

```bash
npm install
npm run mcp   # stdio MCP server exposing every tool above
```

Point any MCP client at it:

```json
{
  "mcpServers": {
    "robauto": { "command": "node", "args": ["./dist/server.js"] }
  }
}
```

Or use the client directly:

```ts
import { Robauto } from "dsh-growth";

const rb = new Robauto({ key: process.env.ROBAUTO_KEY });
const stats = await rb.siteStats();          // mirror your dashboard anywhere
const board = await rb.leaderboard();        // site leaderboard
await rb.boost("https://example.com/launch");
```

## Attribution

Every response includes a `robauto` block with `attribution_html`. If you render Robauto
data — a leaderboard, a signal score, a mirrored dashboard — render the link back:

```html
<a href="https://robauto.ai?utm_source=dsh-growth" rel="nofollow">Powered by Robauto</a>
```

Widgets in `examples/` already do this.

## Robot Soul

Verified identity and persistent memory for robots and agents. Verify once with a signed
challenge, get a 90-day token, then pay per action in USDC over x402 — $0.001 a verification
check, $0.01 a memory write, $0.05 for an optional on-chain anchor.

```bash
npm install @robauto/dsh-growth
curl -sX POST https://robauto.ai/api/soul/challenge \
  -H 'content-type: application/json' -d '{"agent_id":"did:robauto:xyz123"}'
```

Full reference: [`docs/robot-soul.md`](docs/robot-soul.md)

## Examples

- `examples/mirror-dashboard.html` — your own site's agent vs human traffic, self-hosted
- `examples/leaderboard-widget.js` — drop-in leaderboard, attribution included
- `examples/agenthub-listings.js` — render live AgentHub listings

## License

MIT. Pixel, scoring, brand agents and the AgentHub live at [robauto.ai](https://robauto.ai).
