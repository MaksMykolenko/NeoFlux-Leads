import { promises as dns } from "node:dns";
import { isIP } from "node:net";

/**
 * SSRF guard for any flow that fetches a user-supplied URL (currently the
 * website auditor in src/modules/scraper). The audit runs Playwright inside
 * a serverless function with the same network access as our backend — without
 * this validator a user could submit `http://169.254.169.254/latest/meta-data`
 * (AWS instance metadata), `http://localhost:5432` (internal Postgres), or
 * any private-RFC1918 / link-local address and pivot from the audit to read
 * internal services.
 *
 * Returns `{ ok: true, normalizedUrl }` for safe inputs. The normalizedUrl is
 * the same URL after parsing, useful so callers don't accidentally pass an
 * un-validated string.
 *
 * Returns `{ ok: false, reason, message }` for anything dangerous:
 *   - non-http(s) scheme (file://, ftp://, javascript:, data:)
 *   - userinfo segment (user:pass@host) — common phishing-style URL
 *   - DNS resolves to private / loopback / link-local / metadata IPs
 *   - DNS resolution fails (host unreachable)
 *
 * Note: this is a TOCTOU-best-effort. A malicious DNS server could resolve
 * to a public IP at validate time and a private IP at goto time. For deeper
 * defense use a forward proxy with allowlist or run audits in a separate
 * sandboxed network namespace.
 */
export type UrlSafetyCheck =
  | { ok: true; normalizedUrl: string; resolvedIps: string[] }
  | { ok: false; reason: UrlSafetyReason; message: string };

export type UrlSafetyReason =
  | "INVALID_URL"
  | "DISALLOWED_SCHEME"
  | "USERINFO_IN_URL"
  | "DNS_FAILED"
  | "PRIVATE_IP"
  | "LOOPBACK"
  | "LINK_LOCAL"
  | "METADATA_IP";

const METADATA_IPS = new Set([
  "169.254.169.254", // AWS / GCP / Azure instance metadata
  "100.100.100.200", // Alibaba Cloud metadata
]);

function isLoopbackV4(parts: number[]): boolean {
  // 127.0.0.0/8
  return parts[0] === 127;
}

function isLinkLocalV4(parts: number[]): boolean {
  // 169.254.0.0/16
  return parts[0] === 169 && parts[1] === 254;
}

function isPrivateV4(parts: number[]): boolean {
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 0.0.0.0/8 (legacy "this network")
  if (parts[0] === 0) return true;
  // 100.64.0.0/10 (CGNAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
  return false;
}

function classifyV4(ip: string): UrlSafetyReason | null {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return "INVALID_URL";
  }
  if (METADATA_IPS.has(ip)) return "METADATA_IP";
  if (isLoopbackV4(parts)) return "LOOPBACK";
  if (isLinkLocalV4(parts)) return "LINK_LOCAL";
  if (isPrivateV4(parts)) return "PRIVATE_IP";
  return null;
}

function classifyV6(ip: string): UrlSafetyReason | null {
  const lower = ip.toLowerCase();
  // ::1 — loopback
  if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return "LOOPBACK";
  // fe80::/10 — link-local
  if (lower.startsWith("fe80:") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return "LINK_LOCAL";
  }
  // fc00::/7 — unique local addresses (ULA)
  if (lower.startsWith("fc") || lower.startsWith("fd")) return "PRIVATE_IP";
  // ::ffff:127.0.0.1 — IPv4-mapped loopback
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice("::ffff:".length);
    return classifyV4(v4);
  }
  // :: — unspecified
  if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return "PRIVATE_IP";
  return null;
}

export function classifyUnsafeIp(ip: string): UrlSafetyReason | null {
  const normalized = ip.replace(/^\[|\]$/g, "");
  const family = isIP(normalized);
  if (family === 0) return null;
  if (family === 6) return classifyV6(normalized);
  return classifyV4(normalized);
}

export async function validateExternalUrl(
  rawUrl: string,
): Promise<UrlSafetyCheck> {
  // 1. Parse
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      reason: "INVALID_URL",
      message: "URL не вдалося розпарсити",
    };
  }

  // 2. Scheme
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      reason: "DISALLOWED_SCHEME",
      message: `Дозволено лише http(s). Отримано: ${parsed.protocol}`,
    };
  }

  // 3. No userinfo (user:pass@host) — common in phishing & SSRF tricks
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      reason: "USERINFO_IN_URL",
      message: "URL з вбудованим логіном/паролем не дозволено",
    };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!hostname) {
    return {
      ok: false,
      reason: "INVALID_URL",
      message: "URL не має hostname",
    };
  }

  // 4. Hostname is sometimes a literal IP — check directly
  const literalIpReason = classifyUnsafeIp(hostname);
  if (literalIpReason) {
    return {
      ok: false,
      reason: literalIpReason,
      message: reasonMessage(literalIpReason, hostname),
    };
  }

  // 5. DNS-resolve hostname and check ALL returned addresses
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return {
      ok: false,
      reason: "DNS_FAILED",
      message: `Не вдалося визначити IP хоста ${hostname}`,
    };
  }
  if (addresses.length === 0) {
    return {
      ok: false,
      reason: "DNS_FAILED",
      message: `DNS не повернув жодного запису для ${hostname}`,
    };
  }

  for (const { address } of addresses) {
    const reason = classifyUnsafeIp(address);
    if (reason) {
      return {
        ok: false,
        reason,
        message: reasonMessage(reason, address),
      };
    }
  }

  return {
    ok: true,
    normalizedUrl: parsed.toString(),
    resolvedIps: addresses.map((a) => a.address),
  };
}

function reasonMessage(reason: UrlSafetyReason, ip: string): string {
  switch (reason) {
    case "METADATA_IP":
      return `Хост ${ip} — це cloud metadata-сервер, доступ заборонено.`;
    case "LOOPBACK":
      return `Хост ${ip} вказує на loopback, доступ заборонено.`;
    case "LINK_LOCAL":
      return `Хост ${ip} — link-local адреса, доступ заборонено.`;
    case "PRIVATE_IP":
      return `Хост ${ip} — приватна (RFC1918/ULA) адреса, доступ заборонено.`;
    case "INVALID_URL":
      return `Невалідний хост ${ip}.`;
    case "DISALLOWED_SCHEME":
      return `Невалідна схема.`;
    case "USERINFO_IN_URL":
      return `URL містить userinfo.`;
    case "DNS_FAILED":
      return `Хост ${ip} не зрезолвлений у IP.`;
  }
}
