import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders the default button variant", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
    );
  });

  it("can render as a child element", () => {
    render(
      <Button asChild>
        <a href="/demo">Open demo</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Open demo" })).toHaveAttribute("href", "/demo");
  });
});
