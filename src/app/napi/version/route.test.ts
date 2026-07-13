import { describe, expect, it, vi } from "vitest";

import { GET } from "@/app/napi/version/route";

describe("GET /napi/version", () => {
  it("returns the injected git commit sha", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT_SHA", "test-sha");

    const response = GET();

    await expect(response.json()).resolves.toEqual({
      sha: "test-sha",
    });
  });

  it("keeps the response shape when the sha is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT_SHA", "");

    const response = GET();

    await expect(response.json()).resolves.toEqual({
      sha: "unknown",
    });
  });
});
