import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/ui/toaster";
import i18n from "@/i18n/client";

const { toastsMock } = vi.hoisted(() => ({
  toastsMock: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toasts: toastsMock(),
  }),
}));

function renderToaster() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Toaster />
    </I18nextProvider>,
  );
}

describe("Toaster", () => {
  beforeEach(async () => {
    toastsMock.mockReturnValue([]);
    await i18n.changeLanguage("zh-CN");
  });

  it("renders nothing but the viewport when there are no toasts", () => {
    renderToaster();

    expect(screen.getByLabelText("Notifications (F8)")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders toast content, action, icon, and localized close label", () => {
    toastsMock.mockReturnValue([
      {
        action: <button type="button">Refresh</button>,
        description: "刷新页面即可使用最新内容。",
        icon: <span aria-hidden="true">icon</span>,
        id: "version-update",
        open: true,
        title: "发现新版本",
      },
    ]);

    renderToaster();

    expect(screen.getByText("发现新版本")).toBeInTheDocument();
    expect(screen.getByText("刷新页面即可使用最新内容。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });
});
