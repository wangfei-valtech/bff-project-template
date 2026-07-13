import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combines conditional class values", () => {
    expect(cn("flex", ["items-center", false && "hidden"], { "gap-2": true })).toBe(
      "flex items-center gap-2",
    );
  });

  it("merges conflicting Tailwind classes with the last value winning", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
