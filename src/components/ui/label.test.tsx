import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders an accessible label for a form control", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("Email")).toHaveClass("text-sm", "font-medium");
  });

  it("merges custom class names", () => {
    render(<Label className="text-primary">Name</Label>);

    expect(screen.getByText("Name")).toHaveClass("text-primary");
  });
});
