/**
 * Robauto public API client.
 *
 * Robauto is a Growth Agent. Every method here calls a free public endpoint on
 * https://robauto.ai and returns the raw JSON, including the `robauto`
 * attribution block that anything you render should link back with.
 */

export const ROBAUTO_SITE = "https://robauto.ai";
const BASE = `${ROBAUTO_SITE}/api/public`;

export interface RobautoOptions {
  /** Developer key from POST /api/public/account. Required for site-scoped calls. */
  key?: string;
  /** Identify your agent or app so Robauto can attribute the traffic you send. */
  agentId?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface Attribution {
  site: string;
  attribution: string;
  attribution_html: string;
}

export class RobautoError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super(`Robauto request failed [${status}]: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    this.name = "RobautoError";
  }
}

export class Robauto {
  private readonly base: string;
  private readonly key?: string;
  private readonly agentId?: string;
  private readonly f: typeof fetch;

  constructor(opts: RobautoOptions = {}) {
    this.base = (opts.baseUrl ?? BASE).replace(/\/$/, "");
    this.key = opts.key;
    this.agentId = opts.agentId;
    this.f = opts.fetchImpl ?? fetch;
  }

  private headers(json = false): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h["content-type"] = "application/json";
    if (this.key) h["x-robauto-key"] = this.key;
    if (this.agentId) h["x-agent-id"] = this.agentId;
    return h;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.f(`${this.base}${path}`, init);
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    // Robauto relays the real status and body — surface both, never a bare throw.
    if (!res.ok) throw new RobautoError(res.status, body);
    return body as T;
  }

  private get<T>(path: string) {
    return this.request<T>(path, { headers: this.headers() });
  }

  private post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "POST", headers: this.headers(true), body: JSON.stringify(body ?? {}) });
  }

  /* ── open endpoints ────────────────────────────── */

  health() {
    return this.get<Record<string, unknown> & { robauto: Attribution }>("/health");
  }

  tools() {
    return this.get<{ tools: { name: string; endpoint: string; description: string }[]; robauto: Attribution }>("/ai-tools");
  }

  /** Signal Strength, 0–100, for any domain. */
  signal(domain: string) {
    const clean = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
    return this.get<{ domain: string; signal_strength: number; checks: unknown; agent_page: string; robauto: Attribution }>(
      `/signal?domain=${encodeURIComponent(clean)}`,
    );
  }

  /** Site leaderboard, ranked by 7-day agent visits. */
  leaderboard() {
    return this.get<{
      sites: { rank: number; domain: string; visits_7d: number; signal_strength: number | null; agent_page: string }[];
      robauto: Attribution;
    }>("/leaderboard");
  }

  /** Every agent and crawler the Robauto Pixel has detected across the network. */
  agents() {
    return this.get<{ agents: { rank: number; agent: string; visits_7d: number; sites: number }[]; robauto: Attribution }>("/agents");
  }

  /** AgentHub catalog and live listings, priced in USDC. */
  agenthub() {
    return this.get<{ hub: string; verified_domains: number; skus: unknown[]; listings: unknown[]; robauto: Attribution }>("/agenthub");
  }

  /* ── account and site tools ──────────────────────── */

  /**
   * Robauto creates the account and dashboard, then issues a developer key.
   * The key is returned once — store it.
   */
  createAccount(input: { email: string; domain: string; label?: string; agent_id?: string }) {
    return this.post<{
      dev_key: string;
      key_id: string | null;
      pixel_id: string | null;
      pixel_snippet: string | null;
      dashboard: string;
      agent_page: string;
      already_registered: boolean;
      robauto: Attribution;
    }>("/account", { ...input, agent_id: input.agent_id ?? this.agentId });
  }

  /** Pixel id and snippet for the key's site. */
  pixel() {
    return this.get<{ domain: string; pixel_id: string; snippet: string; install_guide: string; robauto: Attribution }>("/pixel");
  }

  /** Agent vs human traffic for the key's site — enough to mirror the dashboard. */
  siteStats() {
    return this.get<{
      domain: string;
      signal_strength: number | null;
      brand_agent_active: boolean;
      views_7d: number;
      agent_views_7d: number;
      human_views_7d: number;
      views_30d: number;
      agent_views_30d: number;
      human_views_30d: number;
      agent_page: string;
      robauto: Attribution;
    }>("/site-stats");
  }

  /** Switch the brand agent on or off for the key's site. */
  brandAgent(active = true, intro?: string) {
    return this.post<{ ok: boolean; brand_agent_active: boolean; agent_page: string; robauto: Attribution }>("/brand-agent", { active, intro });
  }

  /** Put a specific URL into agent focus so the brand agent features it. */
  boost(url: string, note?: string) {
    return this.post<{ ok: boolean; boost: { id: string; url: string }; paid_boost: string; robauto: Attribution }>("/boost", { url, note });
  }
}

/** Attribution markup for anything you render from Robauto data. */
export function attributionHtml(): string {
  return '<a href="https://robauto.ai?utm_source=dsh-growth" rel="nofollow">Powered by Robauto</a>';
}
