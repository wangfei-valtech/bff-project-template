"use client";

import { useTranslation } from "react-i18next";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { t } = useTranslation();
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ action, description, icon, id, title, ...props }) => (
        <Toast key={id} {...props}>
          {icon ? (
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            {action ? <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div> : null}
          </div>
          <ToastClose aria-label={t("common.close")} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
