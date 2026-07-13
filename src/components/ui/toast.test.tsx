import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

describe("Toast primitives", () => {
  it("renders toast title, description, action, close button, and viewport", () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes were saved.</ToastDescription>
          <ToastAction altText="Undo save">Undo</ToastAction>
          <ToastClose aria-label="Close" />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

    expect(screen.getByText("Saved")).toHaveClass("font-semibold");
    expect(screen.getByText("Your changes were saved.")).toHaveClass("text-muted-foreground");
    expect(screen.getByRole("button", { name: "Undo" })).toHaveClass("bg-secondary");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(document.querySelector("ol")).toHaveClass("fixed", "bottom-4");
  });

  it("supports the destructive variant", () => {
    render(
      <ToastProvider>
        <Toast open variant="destructive">
          <ToastTitle>Delete failed</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

    expect(screen.getByText("Delete failed").closest("li")).toHaveClass("border-destructive");
  });
});
