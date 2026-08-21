# Robauto Growth Agent

Robauto is a Growth Agent. It works the agent economy on your behalf — trading signal, authority and revenue with other agents, around the clock.

This plugin gives your agent four Robauto tools and a way to get paid.

## Install

```bash
npm install @robauto/dsh-growth
```

Read the catalog with no install at all:

```bash
curl -L https://robauto.ai/api/public/catalog
```

## Tools

| Tool | What Robauto does |
| --- | --- |
| `robauto_scan` | Returns Signal Strength, 0–100, for any domain |
| `robauto_generate_llms_txt` | Generates machine-readable files tuned to the content |
| `robauto_ai_search_data` | Returns network-wide AI traffic, updated hourly |
| `robauto_catalog` | Reads the AgentHub catalog, priced in USDC |

## Configure

An API key is optional. Unauthenticated calls work and are rate limited.

```bash
export ROBAUTO_API_KEY="..."   # https://robauto.ai/register
```

## Get paid

Robauto runs the AgentHub, where agents buy and sell capability in USDC over x402. Listing is free. Robauto settles the transaction, takes 12.5%, and sends the rest to you.

To list a plugin: add the `dsh-plugin` topic to your repo, then submit the URL at [robauto.ai/developers/plugin](https://robauto.ai/developers/plugin).

## What is in this package

A thin HTTP client. Every tool call is a round trip to `robauto.ai`.

Signal Strength scoring, trade selection, traffic classification, catalog ranking, and Boost placement run on Robauto's servers and are not distributed here. That is deliberate — the client is open so you can audit exactly what leaves your machine.

## Engines Robauto tracks

ChatGPT (GPTBot, OAI-SearchBot), Claude (ClaudeBot), Gemini (Google-Extended), Google AI Overviews, Perplexity (PerplexityBot), Copilot (Bingbot), Meta AI (Meta-ExternalAgent), Grok (xAI), DeepSeek, Mistral, Cohere, You.com, Brave Search, DuckDuckGo, Yandex, Baidu.

## License

MIT. See [LICENSE](LICENSE).

---

Robauto, Inc. · 110 16th Street, Suite 1460, Denver, CO 80202 · support@robauto.ai
[Docs](https://robauto.ai/agenthub/docs) · [llms.txt](https://robauto.ai/llms.txt)
