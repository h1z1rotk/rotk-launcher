import { session } from "electron";

/**
 * Detects the operating system proxy configuration via Electron's Chromium
 * network stack and provides utilities to apply it to main-process HTTP
 * traffic. Node.js global fetch (undici) does not respect system proxy
 * settings by default, so we create a proxy-aware fetch wrapper and set
 * environment variables for libraries that read HTTP_PROXY (electron-updater).
 */

export interface SystemProxyResult {
  /** The detected proxy URL (e.g. "http://proxy:8080"), or null if no proxy. */
  proxyUrl: string | null;
}

/**
 * Read the system proxy by asking Chromium's PAC/WPAD resolver. Returns
 * null when no proxy is configured or only DIRECT is returned.
 */
export async function detectSystemProxy(): Promise<SystemProxyResult> {
  try {
    const resolved = await session.defaultSession.resolveProxy("https://github.com");
    // Chromium returns a PAC-style string: "DIRECT", "PROXY host:port",
    // "HTTPS host:port", or multiple entries separated by ";".
    const entries = resolved.split(";").map((entry) => entry.trim());
    for (const entry of entries) {
      if (entry === "DIRECT") continue;
      const match = entry.match(/^(?:PROXY|HTTPS)\s+(.+)$/i);
      if (match) {
        const hostPort = match[1].trim();
        if (hostPort) {
          return { proxyUrl: `http://${hostPort}` };
        }
      }
      // SOCKS entries are not supported by undici ProxyAgent; skip them.
    }
  } catch {
    // resolveProxy can fail if the session is unavailable; fall through.
  }
  return { proxyUrl: null };
}

/**
 * Tell Chromium's renderer session to use the OS proxy settings explicitly.
 * Electron defaults to this, but making it explicit documents intent.
 */
export async function applySystemProxyToSession(): Promise<void> {
  try {
    await session.defaultSession.setProxy({ mode: "system" });
  } catch {
    // The session may not be available in all contexts; fail silently.
  }
}

/**
 * Create a fetch function that routes traffic through the given HTTP proxy.
 * Uses undici's ProxyAgent dispatcher. When no proxy is configured, returns
 * the global fetch unchanged.
 */
export function createProxyFetch(proxyUrl: string | null): typeof fetch {
  if (!proxyUrl) return fetch;
  try {
    // undici is bundled with Node.js 18+ / Electron 22+.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const undici = require("undici") as typeof import("undici");
    const dispatcher = new undici.ProxyAgent(proxyUrl);
    return ((input: string | URL | Request, init?: RequestInit) =>
      undici.fetch(input, { ...init, dispatcher } as never)
    ) as typeof fetch;
  } catch {
    // If undici is not available, fall back to the global fetch.
    return fetch;
  }
}

/**
 * Set HTTP_PROXY and HTTPS_PROXY environment variables so that libraries
 * like electron-updater (which uses axios internally) route through the
 * detected system proxy.
 */
export function applyProxyEnvironmentVariables(proxyUrl: string | null): void {
  if (proxyUrl) {
    process.env.HTTP_PROXY = proxyUrl;
    process.env.HTTPS_PROXY = proxyUrl;
  } else {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
  }
}
