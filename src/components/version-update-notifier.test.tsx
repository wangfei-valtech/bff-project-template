import { render, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VersionUpdateNotifier } from "@/components/version-update-notifier";
import i18n from "@/i18n/client";

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

function renderNotifier() {
  return render(
    <I18nextProvider i18n={i18n}>
      <VersionUpdateNotifier />
    </I18nextProvider>,
  );
}

function setCurrentEtag(etag: string) {
  document.head.innerHTML = `<meta http-equiv="etag" content="${etag}" />`;
}

describe("VersionUpdateNotifier", () => {
  const fetchMock = vi.fn();

  beforeEach(async () => {
    toastMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  it("shows an update toast when the remote etag changes", async () => {
    setCurrentEtag("current-etag");
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi
        .fn()
        .mockResolvedValue(
          '<html><head><meta http-equiv="etag" content="remote-etag" /></head></html>',
        ),
    });

    renderNotifier();

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledTimes(1);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "刷新页面即可使用最新内容。",
        id: "version-update",
        title: "发现新版本",
      }),
    );
  });

  it("does not show duplicate toasts for the same remote etag", async () => {
    setCurrentEtag("current-etag");
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi
        .fn()
        .mockResolvedValue(
          '<html><head><meta http-equiv="etag" content="remote-etag" /></head></html>',
        ),
    });

    renderNotifier();

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new Event("focus"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(toastMock).toHaveBeenCalledTimes(1);
  });
});
