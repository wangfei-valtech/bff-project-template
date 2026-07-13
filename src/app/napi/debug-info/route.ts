import { isIP } from "node:net";

import type { NetworkDebugInfo } from "@/lib/debug-info";

export const dynamic = "force-dynamic";

type HeaderSource = NetworkDebugInfo["ip"]["source"];

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function decodeHeader(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveIp(headers: Headers): { address: string | null; source: HeaderSource } {
  const candidates: Array<{ source: HeaderSource; value: string | null }> = [
    { source: "vercel", value: headers.get("x-vercel-forwarded-for") },
    { source: "cloudflare", value: headers.get("cf-connecting-ip") },
    { source: "proxy", value: headers.get("x-real-ip") },
    { source: "proxy", value: headers.get("x-forwarded-for") },
  ];

  for (const candidate of candidates) {
    const address = firstHeaderValue(candidate.value);
    if (address && isIP(address)) {
      return { address, source: candidate.source };
    }
  }

  return { address: null, source: "unavailable" };
}

function firstAvailable(headers: Headers, names: string[]) {
  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      return decodeHeader(value);
    }
  }
  return null;
}

/** 返回当前请求的白名单网络与 IP 地理信息，不反射敏感请求头。 */
export function GET(request: Request) {
  const ip = resolveIp(request.headers);
  const response: NetworkDebugInfo = {
    collectedAt: new Date().toISOString(),
    ip: {
      ...ip,
      version: ip.address ? (isIP(ip.address) as 4 | 6) : null,
    },
    location: {
      city: firstAvailable(request.headers, ["x-vercel-ip-city", "cf-ipcity"]),
      continent: firstAvailable(request.headers, ["x-vercel-ip-continent", "cf-ipcontinent"]),
      country: firstAvailable(request.headers, ["x-vercel-ip-country", "cf-ipcountry"]),
      latitude: firstAvailable(request.headers, ["x-vercel-ip-latitude", "cf-iplatitude"]),
      longitude: firstAvailable(request.headers, ["x-vercel-ip-longitude", "cf-iplongitude"]),
      postalCode: firstAvailable(request.headers, ["x-vercel-ip-postal-code", "cf-postal-code"]),
      region: firstAvailable(request.headers, ["cf-region"]),
      regionCode: firstAvailable(request.headers, ["x-vercel-ip-country-region", "cf-region-code"]),
      timezone: firstAvailable(request.headers, ["x-vercel-ip-timezone", "cf-timezone"]),
    },
  };

  return Response.json(response, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
