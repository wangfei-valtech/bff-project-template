import { createStore } from "jotai";
import { describe, expect, it } from "vitest";

import { isSupportedLanguage, languageAtom } from "@/core/state/language";

describe("language state", () => {
  it("accepts only configured languages", () => {
    expect(isSupportedLanguage("zh-CN")).toBe(true);
    expect(isSupportedLanguage("en-US")).toBe(true);
    expect(isSupportedLanguage("fr-FR")).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
  });

  it("persists language changes to localStorage", () => {
    const store = createStore();

    expect(store.get(languageAtom)).toBe("zh-CN");

    store.set(languageAtom, "en-US");

    expect(store.get(languageAtom)).toBe("en-US");
    expect(window.localStorage.getItem("language")).toBe("en-US");
  });
});
