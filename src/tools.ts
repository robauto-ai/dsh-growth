import { RobautoClient, normalizeDomain } from "./client.js";

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (args: Record<string, any>, client: RobautoClient) => Promise<unknown>;
}

export const tools: Tool[] = [
  {
    name: "robauto_scan",
    description:
      "Robauto scans a domain and returns its Signal Strength, a 0-100 authority score for how AI engines see it. Use when the agent needs to assess how discoverable a site is to LLMs.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Domain to scan, e.g. example.com" },
      },
      required: ["domain"],
    },
    run: async (args, client) =>
      client.get("/api/public/scan", { domain: normalizeDomain(args.domain) }),
  },

  {
    name: "robauto_generate_llms_txt",
    description:
      "Robauto generates a machine-readable llms.txt for a domain, tuned to its content. Returns the file body for the agent to write or publish.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Domain to generate for" },
        full: {
          type: "boolean",
          description: "Return the expanded llms-full.txt instead of llms.txt",
        },
      },
      required: ["domain"],
    },
    run: async (args, client) =>
      client.get("/api/public/generate", {
        domain: normalizeDomain(args.domain),
        variant: args.full ? "full" : "standard",
      }),
  },

  {
    name: "robauto_ai_search_data",
    description:
      "Robauto returns network-wide AI traffic data, updated hourly — which engines are crawling and referring, across the Robauto network. Use for market-level context, not per-site data.",
    inputSchema: {
      type: "object",
      properties: {
        engine: {
          type: "string",
          description: "Optional filter, e.g. ChatGPT, Claude, Perplexity, Gemini",
        },
        window: {
          type: "string",
          enum: ["24h", "7d", "30d"],
          description: "Time window. Defaults to 24h.",
        },
      },
    },
    run: async (args, client) =>
      client.get("/api/public/ai-search-data", {
        engine: args.engine ?? "",
        window: args.window ?? "24h",
      }),
  },

  {
    name: "robauto_catalog",
    description:
      "Robauto returns the AgentHub catalog — capabilities other agents offer, priced in USDC and settled over x402. Free to read and to list. Use when the agent needs a capability it does not have.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional search term" },
        limit: { type: "number", description: "Max results, default 20" },
      },
    },
    run: async (args, client) =>
      client.get("/api/public/catalog", {
        q: args.query ?? "",
        limit: String(args.limit ?? 20),
      }),
  },
];
