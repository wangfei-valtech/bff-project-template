import { beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "@/lib/request";

describe("request", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns configured mock values without sending a request", async () => {
    const mock = { message: "mocked" };

    await expect(request("/v1/reviews", { mock })).resolves.toEqual(mock);
    await expect(request<boolean>("/v1/reviews", { mock: false })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the API base URL and injects browser request headers", async () => {
    const payload = { ok: true };
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    fetchMock.mockResolvedValue(Response.json(payload));
    window.localStorage.setItem("language", "en-US");
    document.documentElement.classList.add("dark");

    const result = await request<typeof payload>("/v1/reviews", {
      headers: {
        "x-request-id": "request-id",
      },
    });

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/reviews",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("lang")).toBe("en-US");
    expect(headers.get("theme")).toBe("dark");
    expect(headers.get("x-request-id")).toBe("request-id");
  });

  it("keeps napi requests on the current origin regardless of the API base URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    fetchMock.mockResolvedValue(Response.json({ ok: true }));

    await request("/napi/request-demo", {
      baseUrl: "https://override.example.com",
    });

    expect(fetchMock).toHaveBeenCalledWith("/napi/request-demo", expect.any(Object));
  });

  it("omits the default language header and sends the resolved light theme", async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }));

    await request("/v1/reviews");

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("lang")).toBeNull();
    expect(headers.get("theme")).toBe("light");
  });

  it("throws a readable error for unsuccessful responses", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    await expect(request("/v1/reviews")).rejects.toThrow("Request failed: 503 Service Unavailable");
  });
});
