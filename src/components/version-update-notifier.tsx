"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CloudDownload, RefreshCw } from "lucide-react";

import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { isSupportedLanguage } from "@/core/state/language";

const dismissedStorageKey = "version-update-dismissed-etag";
const mockVersionUpdateSearchParam = "mock-version-update";
const versionUpdateToastId = "version-update";

function scheduleAfterPageLoad(callback: () => void) {
  let cancelScheduledTask: (() => void) | undefined;

  const schedule = () => {
    // 首次检测延迟到页面 load/idle 之后，避免和首屏 hydration 抢主线程。
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(callback, { timeout: 3000 });
      cancelScheduledTask = () => window.cancelIdleCallback(idleId);
      return;
    }

    const timeoutId = window.setTimeout(callback, 0);
    cancelScheduledTask = () => window.clearTimeout(timeoutId);
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);
    cancelScheduledTask?.();
  };
}

function getEtagFromDocument(targetDocument: Document) {
  const metaTags = targetDocument.getElementsByTagName("meta");

  for (const metaTag of metaTags) {
    if (metaTag.getAttribute("http-equiv")?.toLowerCase() === "etag") {
      return metaTag.getAttribute("content")?.trim() ?? "";
    }
  }

  return "";
}

function isValidEtag(etag: string) {
  return Boolean(etag && etag !== "unknown");
}

function getDismissedEtag() {
  try {
    return window.sessionStorage.getItem(dismissedStorageKey) ?? "";
  } catch {
    return "";
  }
}

function setDismissedEtag(etag: string) {
  try {
    window.sessionStorage.setItem(dismissedStorageKey, etag);
  } catch {
    // 存储失败不应阻断用户关闭更新提示。
  }
}

function getPersistedLanguage() {
  try {
    const language = window.localStorage.getItem("language");
    return isSupportedLanguage(language) ? language : "";
  } catch {
    return "";
  }
}

function getDevelopmentMockRemoteEtag(currentEtag: string) {
  if (process.env.NODE_ENV !== "development") {
    return "";
  }

  // 开发环境可通过 /demo?mock-version-update=1 稳定触发 toast，便于视觉和交互验证。
  const searchParams = new URLSearchParams(window.location.search);

  if (!searchParams.has(mockVersionUpdateSearchParam)) {
    return "";
  }

  const mockEtag = searchParams.get(mockVersionUpdateSearchParam)?.trim();
  return mockEtag && mockEtag !== currentEtag ? mockEtag : "development-mock-version";
}

export function VersionUpdateNotifier() {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const promptedToastKeyRef = useRef("");

  useEffect(() => {
    let inFlight = false;
    let cleanupListeners: (() => void) | undefined;

    const showUpdateToast = (remoteEtag: string) => {
      const toastKey = `${remoteEtag}:${activeLanguage}`;

      // 同一个版本在当前 tab 会话内关闭后不再提示；语言变化只更新同一个 toast，不堆叠多个。
      if (promptedToastKeyRef.current === toastKey || getDismissedEtag() === remoteEtag) {
        return;
      }

      promptedToastKeyRef.current = toastKey;

      toast({
        action: (
          <ToastAction
            altText={t("versionUpdate.refreshAlt")}
            className="gap-2 border-primary bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:ring-primary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t("versionUpdate.refresh")}
          </ToastAction>
        ),
        description: t("versionUpdate.description"),
        duration: 86_400_000,
        icon: <CloudDownload className="size-5" aria-hidden="true" />,
        id: versionUpdateToastId,
        onOpenChange: (open) => {
          if (!open) {
            setDismissedEtag(remoteEtag);
          }
        },
        title: t("versionUpdate.title"),
      });
    };

    const checkVersionUpdate = async () => {
      if (inFlight || document.visibilityState === "hidden") {
        return;
      }

      // 等待本地持久化语言恢复完成，避免先按默认语言弹 toast 后再切语言造成闪烁。
      const persistedLanguage = getPersistedLanguage();
      if (persistedLanguage && persistedLanguage !== activeLanguage) {
        return;
      }

      const currentEtag = getEtagFromDocument(document);

      if (!isValidEtag(currentEtag)) {
        return;
      }

      const mockRemoteEtag = getDevelopmentMockRemoteEtag(currentEtag);

      if (mockRemoteEtag) {
        showUpdateToast(mockRemoteEtag);
        return;
      }

      inFlight = true;

      try {
        // 拉取站点根 HTML 并对比其中的 etag meta，绕开当前页面缓存判断远端是否已发布新版本。
        const rootUrl = new URL("/", window.location.origin);
        rootUrl.searchParams.set("__version_check", String(Date.now()));

        const response = await window.fetch(rootUrl.toString(), {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "text/html",
          },
        });

        if (!response.ok) {
          return;
        }

        const remoteHtml = await response.text();
        const remoteDocument = new DOMParser().parseFromString(remoteHtml, "text/html");
        const remoteEtag = getEtagFromDocument(remoteDocument);

        if (isValidEtag(remoteEtag) && remoteEtag !== currentEtag) {
          showUpdateToast(remoteEtag);
        }
      } catch {
        // 网络或解析失败时静默降级为“未发现更新”，避免把临时故障暴露给用户。
      } finally {
        inFlight = false;
      }
    };

    const registerVersionUpdateCheck = () => {
      const onFocus = () => {
        void checkVersionUpdate();
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          void checkVersionUpdate();
        }
      };

      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibilityChange);
      void checkVersionUpdate();

      cleanupListeners = () => {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    };

    const cancelScheduledRegistration = scheduleAfterPageLoad(registerVersionUpdateCheck);

    return () => {
      cancelScheduledRegistration();
      cleanupListeners?.();
    };
  }, [activeLanguage, t, toast]);

  return null;
}
