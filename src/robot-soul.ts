import { webcrypto as nodeCrypto } from "node:crypto";

/**
 * Robot Soul client — verified agent identity plus persistent memory.
 *
 * Verification happens once: the agent signs a one-time challenge and receives
 * a 90-day token. Every later call presents the token, so verification never
 * costs a chain call or a signature check.
 */
export const SOUL_BASE = "https://robauto.ai/api/soul";

const subtle = (globalThis.crypto ?? (nodeCrypto as unknown as Crypto)).subtle;

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

export interface RobotSoulOptions {
  /** Stable agent identifier, e.g. "did:robauto:xyz123". */
  agentId: string;
  /** Ed25519 private key (base64 PKCS#8). Used once, for the T1 challenge. */
  privateKey?: string;
  /** Matching Ed25519 public key (base64, raw 32 bytes or SPKI). */
  publicKey?: string;
  /** An existing 90-day token — skips registration entirely. */
  token?: string;
  baseUrl?: string;
}

export interface SoulRecord {
  agent_id: string;
  semantic: Record<string, unknown>;
  episodic: unknown[];
  goals: Record<string, unknown>;
  preferences: Record<string, unknown>;
  wallet: Record<string, unknown>;
  beliefs: Record<string, unknown>;
  updated_at: string;
}

export class RobotSoulError extends Error {
  constructor(message: string, readonly status: number, readonly body: unknown) {
    super(message);
    this.name = "RobotSoulError";
  }
}

export class RobotSoul {
  private constructor(
    readonly agentId: string,
    readonly token: string | null,
    readonly tier: number,
    private readonly baseUrl: string,
  ) {}

  /** Registers (or resumes) the agent and returns a ready client. */
  static async init(options: RobotSoulOptions): Promise<RobotSoul> {
    const baseUrl = options.baseUrl ?? SOUL_BASE;
    if (options.token) return new RobotSoul(options.agentId, options.token, 1, baseUrl);

    const challenge = await request<{ challenge: string }>(baseUrl, "/challenge", {
      method: "POST",
      body: { agent_id: options.agentId },
    });

    let signature: string | undefined;
    if (options.privateKey) {
      const key = await subtle.importKey(
        "pkcs8",
        Buffer.from(options.privateKey, "base64"),
        { name: "Ed25519" },
        false,
        ["sign"],
      );
      const sig = await subtle.sign(
        { name: "Ed25519" },
        key,
        new TextEncoder().encode(challenge.challenge),
      );
      signature = b64(new Uint8Array(sig));
    }

    const registered = await request<{ token: string | null; tier: number }>(baseUrl, "/register", {
      method: "POST",
      body: { agent_id: options.agentId, public_key: options.publicKey ?? "", signature },
    });

    return new RobotSoul(options.agentId, registered.token, registered.tier, baseUrl);
  }

  /** Reads the whole soul record. Free. */
  async soul(): Promise<SoulRecord> {
    const res = await request<{ soul: SoulRecord }>(this.baseUrl, `/soul/${encodeURIComponent(this.agentId)}`, {
      token: this.token,
    });
    return res.soul;
  }

  /** Reads one semantic key. Free. */
  async recall<T = unknown>(key: string): Promise<T | undefined> {
    const soul = await this.soul();
    return soul.semantic?.[key] as T | undefined;
  }

  /**
   * Writes durable facts. Costs $0.01 USDC — pass the x402 payment header your
   * wallet middleware produced, or catch the 402 and retry with it.
   */
  async remember(key: string, facts: unknown, payment?: string): Promise<{ ok: boolean; keys: string[] }> {
    return await request(this.baseUrl, `/soul/${encodeURIComponent(this.agentId)}/remember`, {
      method: "POST",
      token: this.token,
      payment,
      body: { key, facts },
    });
  }

  /** Optional Tier 2 export to Base. Costs $0.05 USDC. */
  async anchor(payment?: string): Promise<{ ok: boolean; status: string }> {
    return await request(this.baseUrl, `/soul/${encodeURIComponent(this.agentId)}/anchor`, {
      method: "POST",
      token: this.token,
      payment,
      body: {},
    });
  }

  /** Service card: tiers, pricing, endpoints. No auth. */
  static async card(baseUrl = SOUL_BASE): Promise<Record<string, unknown>> {
    return await request(baseUrl, "");
  }
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: { method?: string; body?: unknown; token?: string | null; payment?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  if (init.payment) headers["x-payment"] = init.payment;

  const res = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new RobotSoulError(`robot-soul ${path || "/"} failed [${res.status}]: ${text}`, res.status, body);
  }
  return body as T;
}

const safeJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
