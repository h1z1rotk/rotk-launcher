import type { GithubProxyConfig } from "../../shared/contracts.js";

/**
 * Rewrites GitHub URLs through a configured proxy service (jsdelivr, ghproxy,
 * or custom) and computes the host allowlists needed for secure redirect
 * following. The proxy is a transport concern only: SHA-256 verification of
 * downloaded content remains unchanged.
 */

const GITHUB_HOSTS = new Set([
  "github.com",
  "raw.githubusercontent.com",
  "api.github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
]);

const JSDELIVR_HOST = "cdn.jsdelivr.net";
const GHPROXY_HOST = "ghproxy.net";

function isGithubHost(hostname: string): boolean {
  return GITHUB_HOSTS.has(hostname);
}

/**
 * Rewrite a GitHub URL through the configured proxy.
 *
 * - jsdelivr: converts raw content and release download URLs to the CDN
 *   format. API URLs (api.github.com) pass through unchanged because
 *   jsdelivr does not proxy the GitHub API.
 * - ghproxy / custom: the original URL is appended after the proxy base.
 * - none: returns the URL unchanged.
 */
export function rewriteGithubUrl(rawUrl: string, proxy: GithubProxyConfig): string {
  if (proxy.type === "none") return rawUrl;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  if (!isGithubHost(parsed.hostname)) return rawUrl;

  switch (proxy.type) {
    case "jsdelivr":
      return rewriteViaJsdelivr(parsed);
    case "ghproxy":
      return `https://${GHPROXY_HOST}/${rawUrl}`;
    case "custom": {
      const base = (proxy.url ?? "").replace(/\/+$/, "");
      if (!base) return rawUrl;
      return `${base}/${rawUrl}`;
    }
    default:
      return rawUrl;
  }
}

function rewriteViaJsdelivr(parsed: URL): string {
  // api.github.com cannot be proxied through jsdelivr; return unchanged so
  // the caller falls back to direct or system-proxy access.
  if (parsed.hostname === "api.github.com") return parsed.href;

  // raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  // -> cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
  if (parsed.hostname === "raw.githubusercontent.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      const [owner, repo, branch, ...rest] = segments;
      const path = rest.join("/");
      return `https://${JSDELIVR_HOST}/gh/${owner}/${repo}@${branch}/${path}`;
    }
    return parsed.href;
  }

  // github.com/{owner}/{repo}/releases/download/{tag}/{name}
  // -> cdn.jsdelivr.net/gh/{owner}/{repo}@{tag}/{name}
  if (parsed.hostname === "github.com") {
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/);
    if (match) {
      const [, owner, repo, tag, name] = match;
      return `https://${JSDELIVR_HOST}/gh/${owner}/${repo}@${tag}/${name}`;
    }
  }

  // Any other GitHub URL: pass through unchanged.
  return parsed.href;
}

/**
 * Return the set of proxy-specific hosts that must be added to the existing
 * allowlists. With type "none", the set is empty.
 */
export function proxyHosts(proxy: GithubProxyConfig): Set<string> {
  switch (proxy.type) {
    case "jsdelivr":
      return new Set([JSDELIVR_HOST]);
    case "ghproxy":
      return new Set([GHPROXY_HOST]);
    case "custom": {
      try {
        const parsed = new URL(proxy.url ?? "");
        if (parsed.hostname) return new Set([parsed.hostname]);
      } catch {
        // Invalid URL — return empty set.
      }
      return new Set();
    }
    default:
      return new Set();
  }
}

/**
 * Merge the original first-hop host allowlist with proxy hosts so the proxy
 * service is accepted as the initial connection target.
 */
export function allowedFirstHopHosts(
  originalHosts: ReadonlySet<string>,
  proxy: GithubProxyConfig,
): Set<string> {
  const extra = proxyHosts(proxy);
  if (extra.size === 0) return new Set(originalHosts);
  return new Set([...originalHosts, ...extra]);
}
