import { beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "@/lib/request";

describe("request", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  it("returns mock data without calling fetch", async () => {
    const mock = { message: "mocked" };

    await expect(request("/api/demo", { mock })).resolves.toEqual(mock);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns falsy mock data without calling fetch", async () => {
    await expect(request<boolean>("/api/demo", { mock: false })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("injects language and theme headers for browser requests", async () => {
    const payload = { ok: true };
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue(payload),
      ok: true,
    });
    window.localStorage.setItem("language", "en-US");
    document.documentElement.classList.add("dark");

    const result = await request<typeof payload>("/api/demo", {
      baseUrl: "https://api.example.com",
      headers: {
        "x-request-id": "request-id",
      },
    });

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/demo",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("lang")).toBe("en-US");
    expect(headers.get("theme")).toBe("dark");
    expect(headers.get("x-request-id")).toBe("request-id");
  });

  it("omits the language header for the default language and keeps the light theme", async () => {
    fetchMock.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true }),
      ok: true,
    });

    await request("/api/demo");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("lang")).toBeNull();
    expect(headers.get("theme")).toBe("light");
  });

  it("throws a readable error when the response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(request("/api/demo")).rejects.toThrow("Request failed: 503 Service Unavailable");
  });
});
