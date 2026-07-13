import { describe, expect, it } from "vitest";

import { GET } from "@/app/napi/request-demo/route";

describe("GET /napi/request-demo", () => {
  it("returns the request language, theme, and timestamp", async () => {
    const response = GET(
      new Request("https://example.com/napi/request-demo", {
        headers: {
          "accept-language": "en-US,en;q=0.9",
          theme: "dark",
        },
      }),
    );
    const body = await response.json();

    expect(body).toMatchObject({
      headers: {
        "accept-language": "en-US",
        theme: "dark",
      },
    });
    expect(Number.isNaN(Date.parse(body.requestedAt))).toBe(false);
  });

  it("uses stable defaults when optional headers are absent", async () => {
    const response = GET(new Request("https://example.com/napi/request-demo"));

    await expect(response.json()).resolves.toMatchObject({
      headers: {
        "accept-language": "zh-CN",
        theme: "system",
      },
    });
  });
});
