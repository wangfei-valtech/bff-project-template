import { describe, expect, it, vi } from "vitest";

import { reducer } from "@/components/ui/use-toast";

describe("toast reducer", () => {
  it("replaces an existing toast with the same id", () => {
    const state = reducer(
      {
        toasts: [{ id: "version-update", open: true, title: "Old title" }],
      },
      {
        toast: { id: "version-update", open: true, title: "New title" },
        type: "ADD_TOAST",
      },
    );

    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toEqual(
      expect.objectContaining({
        id: "version-update",
        title: "New title",
      }),
    );
  });

  it("keeps only the newest toast when the limit is reached", () => {
    const state = reducer(
      {
        toasts: [{ id: "old", open: true, title: "Old toast" }],
      },
      {
        toast: { id: "new", open: true, title: "New toast" },
        type: "ADD_TOAST",
      },
    );

    expect(state.toasts).toEqual([
      expect.objectContaining({
        id: "new",
      }),
    ]);
  });

  it("updates an existing toast by id", () => {
    const state = reducer(
      {
        toasts: [{ description: "Old description", id: "toast", open: true }],
      },
      {
        toast: { description: "Updated description", id: "toast" },
        type: "UPDATE_TOAST",
      },
    );

    expect(state.toasts[0]).toEqual(
      expect.objectContaining({
        description: "Updated description",
        id: "toast",
        open: true,
      }),
    );
  });

  it("marks matching toasts as closed before delayed removal", () => {
    vi.useFakeTimers();

    const state = reducer(
      {
        toasts: [
          { id: "first", open: true },
          { id: "second", open: true },
        ],
      },
      {
        toastId: "first",
        type: "DISMISS_TOAST",
      },
    );

    expect(state.toasts).toEqual([
      expect.objectContaining({
        id: "first",
        open: false,
      }),
      expect.objectContaining({
        id: "second",
        open: true,
      }),
    ]);

    vi.useRealTimers();
  });

  it("removes one toast or clears all toasts", () => {
    const state = {
      toasts: [
        { id: "first", open: false },
        { id: "second", open: false },
      ],
    };

    expect(
      reducer(state, {
        toastId: "first",
        type: "REMOVE_TOAST",
      }).toasts,
    ).toEqual([
      expect.objectContaining({
        id: "second",
      }),
    ]);

    expect(
      reducer(state, {
        type: "REMOVE_TOAST",
      }).toasts,
    ).toEqual([]);
  });
});
