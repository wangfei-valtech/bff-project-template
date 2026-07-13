import { act, render, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "@/core/theme";
import { themeInitializationScript } from "@/core/theme-init";

function mockSystemTheme(matchesDark: boolean) {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string): MediaQueryList => {
      const mediaQueryList = {
        addEventListener: vi.fn((event: string, listener: () => void) => {
          if (event === "change") {
            listeners.add(listener);
          }
        }),
        addListener: vi.fn((listener: () => void) => listeners.add(listener)),
        dispatchEvent: vi.fn(),
        get matches() {
          return matchesDark;
        },
        media: query,
        onchange: null,
        removeEventListener: vi.fn((event: string, listener: () => void) => {
          if (event === "change") {
            listeners.delete(listener);
          }
        }),
        removeListener: vi.fn((listener: () => void) => listeners.delete(listener)),
      };

      return mediaQueryList as unknown as MediaQueryList;
    }),
    writable: true,
  });

  return {
    setMatches(nextMatchesDark: boolean) {
      matchesDark = nextMatchesDark;
      listeners.forEach((listener) => listener());
    },
  };
}

function runThemeInitializationScript() {
  window.eval(themeInitializationScript);
}

function ThemeState() {
  const { resolvedTheme } = useTheme();
  return <span>{resolvedTheme ?? "pending"}</span>;
}

describe("theme", () => {
  it("resolves the system theme when no explicit theme is stored", () => {
    mockSystemTheme(true);

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("does not assume a light system theme during server rendering", () => {
    expect(renderToString(<ThemeState />)).toContain("pending");
  });

  it("persists explicit theme changes and applies them to the document", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("applies the stored theme through ThemeProvider", () => {
    window.localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("applies the system theme before React initializes", () => {
    mockSystemTheme(true);
    window.localStorage.setItem("theme", "system");

    runThemeInitializationScript();

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("preserves the initialized system theme during hydration", () => {
    mockSystemTheme(true);
    window.localStorage.setItem("theme", "system");
    runThemeInitializationScript();

    const container = document.createElement("div");
    container.innerHTML = "<div>content</div>";
    document.body.append(container);
    const toggleSpy = vi.spyOn(document.documentElement.classList, "toggle");

    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>,
      { container, hydrate: true },
    );

    expect(toggleSpy).not.toHaveBeenCalledWith("dark", false);
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("updates the document when the system theme changes", () => {
    const systemTheme = mockSystemTheme(false);
    window.localStorage.setItem("theme", "system");

    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>,
    );

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");

    act(() => {
      systemTheme.setMatches(true);
    });

    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    act(() => {
      systemTheme.setMatches(false);
    });

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
