import { describe, expect, it } from "vitest";

import { GET } from "@/app/napi/health-check/route";

describe("GET /napi/health-check", () => {
  it("returns the health status", async () => {
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
  });
});
