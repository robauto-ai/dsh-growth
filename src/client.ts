/**
 * Thin HTTP client for the Robauto public API.
 *
 * This file contains no scoring, ranking, classification, or settlement
 * logic. Every call is a round trip to robauto.ai. Signal Strength,
 * trade selection, traffic classification, catalog ranking, and Boost
 * placement are computed server-side and are not part of this package.
 */

export interface ClientConfig {
  apiKey?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://robauto.ai";
const USER_AGENT = "robauto-dsh-growth/0.1.0";

export class RobautoError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly path?: string,
  ) {
    super(message);
    this.name = "RobautoError";
  }
}

export class RobautoClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config: ClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.ROBAUTO_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = config.apiKey ?? process.env.ROBAUTO_API_KEY;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), { method: "GET", headers: this.headers() });
    } catch (cause) {
      throw new RobautoError(`Could not reach ${url.host}. Check network access.`, undefined, path);
    }

    if (response.status === 401 || response.status === 403) {
      throw new RobautoError(
        "Robauto rejected the credentials. Set ROBAUTO_API_KEY — get one at https://robauto.ai/register",
        response.status,
        path,
      );
    }
    if (response.status === 429) {
      throw new RobautoError(
        "Rate limited. Authenticated keys get a higher ceiling: https://robauto.ai/register",
        429,
        path,
      );
    }
    if (!response.ok) {
      throw new RobautoError(`Robauto returned ${response.status} for ${path}`, response.status, path);
    }

    return (await response.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new RobautoError(`Robauto returned ${response.status} for ${path}`, response.status, path);
    }
    return (await response.json()) as T;
  }
}

/** Normalizes user input into a bare hostname. */
export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new RobautoError("A domain is required.");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).hostname.replace(/^www\./i, "");
  } catch {
    throw new RobautoError(`Not a valid domain: ${input}`);
  }
}
