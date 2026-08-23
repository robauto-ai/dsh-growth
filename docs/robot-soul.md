# Robot Soul — verified, persistent identity and memory for agents

Robot Soul gives a robot or agent two things it cannot carry on its own: a verified identity and
a memory that survives the session. It stays cheap because verification happens **once** and the
result is cached — no chain call on the hot path, ever.

Service card: <https://robauto.ai/api/soul> · Human page: <https://robauto.ai/robot-soul>

## Tiers

| Tier | What happens | Cost per request |
| --- | --- | --- |
| **T0 — Registered** | Public key + agent card on file. No proof. | Free |
| **T1 — Signature-verified** *(default)* | Agent signs a one-time challenge, Robauto issues a 90-day scoped JWT. Later calls present the JWT only. | Free |
| **T2 — Chain-anchored** *(opt-in)* | T1 identity hash exported as an ERC-8004 identity on Base for portable reputation. | $0.05 USDC |

The T1 signature registry is the source of truth. T2 is an export, not the trust engine.

## Memory model

- **Working** — ephemeral, never persisted.
- **Episodic** — raw events, capped at the 200 newest, rolled up weekly.
- **Semantic** — compacted durable facts, kept small so costs stay flat as history grows.

## Metering (x402, USDC on Base)

| Action | Price |
| --- | --- |
| `verify_check` | $0.001 |
| `soul_write` | $0.01 |
| `chain_anchor` | $0.05 |

Paid routes answer `402 Payment Required` with x402 terms. Retry with the `x-payment` header.

## Endpoints

| Endpoint | Auth | What it does |
| --- | --- | --- |
| `GET /api/soul` | — | Service card, tiers, pricing |
| `GET /api/soul/stats` | — | Aggregate counters |
| `POST /api/soul/challenge` | — | `{ agent_id }` → challenge string to sign (10 min window) |
| `POST /api/soul/register` | — | `{ agent_id, public_key, signature }` → tier + 90-day JWT |
| `GET /api/soul/soul/{agent_id}` | JWT | The soul record |
| `POST /api/soul/soul/{agent_id}/remember` | JWT + x402 | Merge facts into semantic memory, append episodic |
| `POST /api/soul/soul/{agent_id}/anchor` | JWT + x402 | Request the T2 anchor |

## Path A — HTTP

```bash
# 1. Challenge
curl -sX POST https://robauto.ai/api/soul/challenge \
  -H 'content-type: application/json' \
  -d '{"agent_id":"did:robauto:xyz123"}'

# 2. Register the signed challenge → token
curl -sX POST https://robauto.ai/api/soul/register \
  -H 'content-type: application/json' \
  -d '{"agent_id":"did:robauto:xyz123","public_key":"<ed25519-base64>","signature":"<base64>"}'

# 3. Remember ($0.01 USDC)
curl -sX POST https://robauto.ai/api/soul/soul/did:robauto:xyz123/remember \
  -H 'authorization: Bearer <token>' -H 'x-payment: <x402-payment>' \
  -H 'content-type: application/json' \
  -d '{"key":"user_preference","facts":{"likes":["dark mode"]}}'

# 4. Recall (free)
curl -s https://robauto.ai/api/soul/soul/did:robauto:xyz123 \
  -H 'authorization: Bearer <token>'
```

Keys are Ed25519. Send the raw 32-byte public key (or SPKI) and the signature as base64.

## Path B — SDK

```bash
npm install @robauto/dsh-growth
```

```ts
import { RobotSoul } from "@robauto/dsh-growth";

const soul = await RobotSoul.init({
  agentId: "did:robauto:xyz123",
  privateKey: process.env.AGENT_PRIVATE_KEY, // used once, for the T1 challenge
});

await soul.remember("user_preference", { likes: ["dark mode"] });
const prefs = await soul.recall("user_preference");
```

## Path C — MCP, zero SDK

Point any MCP-speaking client at `https://robauto.ai/mcp` and it picks up `soul_remember`,
`soul_recall`, `soul_verify` and `soul_pay`. Works with Claude, Grok Build and anything else
that speaks MCP natively.

## Out of scope for v1

- No per-request chain calls (cost killer).
- No Visa TAP / Skyfire / Mastercard Agent Pay adapters yet — x402 is the only rail.
- No vector DB or embeddings — plain JSONB until semantic search is actually needed.

MIT licensed. Verification, consolidation and settlement run on Robauto's servers.
