import { describe, expect, it, vi } from "vitest";

async function loadAssetUrl() {
  vi.resetModules();
  const { assetUrl } = await import("@/lib/assets");
  return assetUrl;
}

describe("assetUrl", () => {
  it("normalizes paths without a leading slash", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const assetUrl = await loadAssetUrl();

    expect(assetUrl("images/logo.png")).toBe("/images/logo.png");
  });

  it("keeps local paths outside production even when a CDN origin exists", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_CDN_ORIGIN", "https://cdn.example.com/");
    const assetUrl = await loadAssetUrl();

    expect(assetUrl("/images/logo.png")).toBe("/images/logo.png");
  });

  it("prefixes production assets with the normalized CDN origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CDN_ORIGIN", "https://cdn.example.com/");
    const assetUrl = await loadAssetUrl();

    expect(assetUrl("images/logo.png")).toBe("https://cdn.example.com/images/logo.png");
  });
});
