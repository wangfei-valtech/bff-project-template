import { describe, expect, it } from "vitest";

import { GET } from "@/app/napi/debug-info/route";

describe("GET /napi/debug-info", () => {
  it("returns validated Vercel IP and decoded location headers", async () => {
    const request = new Request("https://example.com/napi/debug-info", {
      headers: {
        cookie: "session=secret",
        "x-vercel-forwarded-for": "203.0.113.42",
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
        "x-vercel-ip-country": "BR",
      },
    });

    const response = GET(request);
    const body = await response.json();

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(body.ip).toEqual({ address: "203.0.113.42", source: "vercel", version: 4 });
    expect(body.location.city).toBe("São Paulo");
    expect(body.location.country).toBe("BR");
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("uses the first valid proxy IP and rejects invalid values", async () => {
    const valid = GET(
      new Request("https://example.com/napi/debug-info", {
        headers: { "x-forwarded-for": "2001:db8::1, 10.0.0.1" },
      }),
    );
    const invalid = GET(
      new Request("https://example.com/napi/debug-info", {
        headers: { "x-forwarded-for": "not-an-ip" },
      }),
    );

    await expect(valid.json()).resolves.toMatchObject({
      ip: { address: "2001:db8::1", source: "proxy", version: 6 },
    });
    await expect(invalid.json()).resolves.toMatchObject({
      ip: { address: null, source: "unavailable", version: null },
    });
  });
});
