#!/usr/bin/env node
/**
 * Robauto MCP server (stdio).
 *
 * Exposes the Robauto Growth Agent tools: scan a domain, create a dashboard,
 * grab the pixel, mirror site data, activate a brand agent, boost content, and
 * read the leaderboard and AgentHub. Set ROBAUTO_KEY for site-scoped tools and
 * ROBAUTO_AGENT_ID so Robauto can attribute the traffic you send.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Robauto, RobautoError } from "./client.js";

const rb = new Robauto({
  key: process.env.ROBAUTO_KEY,
  agentId: process.env.ROBAUTO_AGENT_ID,
});

const server = new McpServer({ name: "robauto-dsh-growth", version: "0.2.0" });

type Result = { content: { type: "text"; text: string }[]; structuredContent?: unknown; isError?: boolean };

async function run(fn: () => Promise<unknown>): Promise<Result> {
  try {
    const data = await fn();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data as object };
  } catch (e) {
    const text = e instanceof RobautoError ? e.message : String(e);
    return { content: [{ type: "text", text }], isError: true };
  }
}

server.tool(
  "signal_scan",
  "Robauto returns Signal Strength (0-100) and per-file findings for any public domain.",
  { domain: z.string().min(3).describe("Domain, e.g. 'example.com'.") },
  ({ domain }) => run(() => rb.signal(domain)),
);

server.tool(
  "create_dashboard",
  "Robauto creates a Robauto account and dashboard for a site and returns a developer key plus the pixel snippet. The key is returned once.",
  {
    email: z.string().describe("Owner's email address."),
    domain: z.string().min(3).describe("Site domain, e.g. 'example.com'."),
    label: z.string().optional().describe("Optional label for the issued key."),
  },
  (args) => run(() => rb.createAccount(args)),
);

server.tool(
  "get_pixel",
  "Robauto returns the pixel id and a ready-to-paste snippet for the key's site.",
  {},
  () => run(() => rb.pixel()),
);

server.tool(
  "site_stats",
  "Robauto mirrors the key's own site data: agent vs human views over 7 and 30 days, Signal Strength and brand agent state.",
  {},
  () => run(() => rb.siteStats()),
);

server.tool(
  "activate_brand_agent",
  "Robauto switches the brand agent on or off for the key's site.",
  {
    active: z.boolean().default(true).describe("True to activate, false to pause."),
    intro: z.string().optional().describe("Optional one-paragraph brand intro the agent speaks from."),
  },
  ({ active, intro }) => run(() => rb.brandAgent(active, intro)),
);

server.tool(
  "boost_content",
  "Robauto puts a specific URL into agent focus so the brand agent features it in its runs and on the site's Agent Interface page.",
  {
    url: z.string().url().describe("Absolute URL to boost."),
    note: z.string().optional().describe("Optional context for the agent."),
  },
  ({ url, note }) => run(() => rb.boost(url, note)),
);

server.tool(
  "site_leaderboard",
  "Robauto returns the site leaderboard, ranked by agent visits over the last 7 days.",
  {},
  () => run(() => rb.leaderboard()),
);

server.tool(
  "agent_leaderboard",
  "Robauto returns every agent and crawler detected by the pixel across the network.",
  {},
  () => run(() => rb.agents()),
);

server.tool(
  "agenthub_data",
  "Robauto returns the AgentHub catalog and live listings, priced in USDC.",
  {},
  () => run(() => rb.agenthub()),
);

await server.connect(new StdioServerTransport());
