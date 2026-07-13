import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

describe("RadioGroup", () => {
  it("renders radio items with the selected value", () => {
    render(
      <RadioGroup defaultValue="light" aria-label="Theme">
        <RadioGroupItem id="theme-light" value="light" />
        <Label htmlFor="theme-light">Light</Label>
        <RadioGroupItem id="theme-dark" value="dark" />
        <Label htmlFor="theme-dark">Dark</Label>
      </RadioGroup>,
    );

    expect(screen.getByRole("radiogroup", { name: "Theme" })).toHaveClass("grid", "gap-2");
    expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
  });

  it("calls onValueChange when nested label content is selected", () => {
    const onValueChange = vi.fn();

    render(
      <RadioGroup onValueChange={onValueChange} aria-label="Theme">
        <RadioGroupItem id="theme-light" value="light" />
        <Label htmlFor="theme-light">Light</Label>
        <RadioGroupItem id="theme-dark" value="dark" />
        <Label htmlFor="theme-dark">
          <span data-testid="theme-dark-icon" />
          Dark
        </Label>
      </RadioGroup>,
    );

    fireEvent.click(screen.getByTestId("theme-dark-icon"));

    expect(onValueChange).toHaveBeenCalledWith("dark");
  });
});
