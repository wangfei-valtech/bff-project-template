import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function renderSelect({ open = false } = {}) {
  return render(
    <Select defaultValue="zh-CN" open={open}>
      <SelectTrigger aria-label="Language">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="zh-CN">简体中文</SelectItem>
          <SelectItem value="en-US">English</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("renders the trigger with the selected value", () => {
    renderSelect();

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveClass("h-10", "border-input");
    expect(screen.getByText("简体中文")).toBeInTheDocument();
  });

  it("renders option content when opened", () => {
    renderSelect({ open: true });

    expect(screen.getByRole("option", { name: "简体中文" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
  });
});
