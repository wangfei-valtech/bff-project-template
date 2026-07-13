"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const toastLimit = 1;
const toastRemoveDelay = 1_000_000;

type ToasterToast = ToastProps & {
  id: string;
  action?: ToastActionElement;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
};

type Toast = Omit<ToasterToast, "id"> & {
  id?: string;
};

type State = {
  toasts: ToasterToast[];
};

type Action =
  | {
      toast: ToasterToast;
      type: "ADD_TOAST";
    }
  | {
      toast: Partial<ToasterToast>;
      type: "UPDATE_TOAST";
    }
  | {
      toastId?: ToasterToast["id"];
      type: "DISMISS_TOAST";
    }
  | {
      toastId?: ToasterToast["id"];
      type: "REMOVE_TOAST";
    };

const actionTypes = {
  addToast: "ADD_TOAST",
  dismissToast: "DISMISS_TOAST",
  removeToast: "REMOVE_TOAST",
  updateToast: "UPDATE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      toastId,
      type: actionTypes.removeToast,
    });
  }, toastRemoveDelay);

  toastTimeouts.set(toastId, timeout);
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.addToast:
      return {
        ...state,
        toasts: [
          action.toast,
          ...state.toasts.filter((toast) => toast.id !== action.toast.id),
        ].slice(0, toastLimit),
      };

    case actionTypes.updateToast:
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      };

    case actionTypes.dismissToast: {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined
            ? {
                ...toast,
                open: false,
              }
            : toast,
        ),
      };
    }
    case actionTypes.removeToast:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ id = genId(), ...props }: Toast) {
  const update = (nextProps: ToasterToast) =>
    dispatch({
      toast: { ...nextProps, id },
      type: actionTypes.updateToast,
    });
  const dismiss = () => dispatch({ toastId: id, type: actionTypes.dismissToast });

  dispatch({
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        props.onOpenChange?.(open);

        if (!open) {
          dismiss();
        }
      },
    },
    type: actionTypes.addToast,
  });

  return {
    dismiss,
    id,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const index = listeners.indexOf(setState);

      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    dismiss: (toastId?: string) => dispatch({ toastId, type: actionTypes.dismissToast }),
    toast,
  };
}

export { toast, useToast };
