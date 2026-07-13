import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/client";
import { defaultLanguage } from "@/i18n/constants";

describe("i18n client", () => {
  afterEach(async () => {
    await i18n.changeLanguage(defaultLanguage);
  });

  it("uses Chinese as the default language", () => {
    expect(i18n.language).toBe(defaultLanguage);
    expect(i18n.t("versionUpdate.title")).toBe("发现新版本");
  });

  it("switches to English resources", async () => {
    await i18n.changeLanguage("en-US");

    expect(i18n.t("versionUpdate.title")).toBe("New version available");
    expect(i18n.t("versionUpdate.refresh")).toBe("Refresh");
  });
});
