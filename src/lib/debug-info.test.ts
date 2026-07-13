import { describe, expect, it } from "vitest";

import { maskIpAddress, parseUserAgent } from "@/lib/debug-info";

describe("debug info utilities", () => {
  it("parses common browser and operating system user agents", () => {
    expect(
      parseUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0",
      ),
    ).toEqual({
      browserName: "Microsoft Edge",
      browserVersion: "134.0.0.0",
      kernel: "Blink",
      osName: "Windows",
      osVersion: "10.0",
    });
  });

  it("masks IPv4 and IPv6 addresses", () => {
    expect(maskIpAddress("203.0.113.42")).toBe("203.0.113.*");
    expect(maskIpAddress("2001:db8:85a3::8a2e:370:7334")).toBe("2001:db8:85a3:…");
    expect(maskIpAddress(null)).toBeNull();
  });
});
