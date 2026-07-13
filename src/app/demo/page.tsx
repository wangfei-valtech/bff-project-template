"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemoizedFn } from "ahooks";
import { driver } from "driver.js";
import { capitalize } from "es-toolkit";
import { useAtom } from "jotai";
import { Camera, Loader2, Monitor, Moon, Play, Sun } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languageAtom, type Language } from "@/core/state/language";
import { useTheme } from "@/core/theme";
import { request } from "@/lib/request";

const languages: Array<{ label: string; value: Language }> = [
  { label: "中文", value: "zh-CN" },
  { label: "English", value: "en-US" },
];

const themeOptions = [
  { icon: Monitor, labelKey: "theme.system", value: "system" },
  { icon: Sun, labelKey: "theme.light", value: "light" },
  { icon: Moon, labelKey: "theme.dark", value: "dark" },
] as const;

/** 展示 BFF 前端模板集成的各项基础能力。 */
export default function DemoPage() {
  const { t } = useTranslation();
  const [language, setLanguage] = useAtom(languageAtom);
  const { resolvedTheme, setTheme, theme } = useTheme();
  const htmlToImageTaskRef = useRef<Promise<typeof import("html-to-image")> | null>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<"idle" | "copying" | "done" | "error">(
    "idle",
  );
  const [screenshotMessage, setScreenshotMessage] = useState("");

  const activeThemeLabel = useMemo(() => {
    return resolvedTheme ? capitalize(resolvedTheme) : t("theme.pending");
  }, [resolvedTheme, t]);

  const demoRequest = useMutation({
    mutationFn: () =>
      request<{ ok: boolean; requestedAt: string; headers: { lang: string; theme: string } }>(
        "/api/demo",
      ),
  });

  const startGuide = useMemoizedFn(() => {
    driver({
      // Driver.js uses this class as the official theming hook for popover styling.
      popoverClass: "driverjs-app-theme",
      showProgress: true,
      doneBtnText: t("guide.doneButton"),
      nextBtnText: t("guide.nextButton"),
      prevBtnText: t("guide.prevButton"),
      steps: [
        {
          element: "#language-card",
          popover: {
            title: t("guide.languageTitle"),
            description: t("guide.languageDescription"),
          },
        },
        {
          element: "#theme-card",
          popover: {
            title: t("guide.themeTitle"),
            description: t("guide.themeDescription"),
          },
        },
        {
          element: "#request-card",
          popover: {
            title: t("guide.requestTitle"),
            description: t("guide.requestDescription"),
          },
        },
        {
          element: "#demo-screenshot-button",
          popover: {
            title: t("guide.screenshotTitle"),
            description: t("guide.screenshotDescription"),
          },
        },
      ],
    }).drive();
  });

  const loadHtmlToImage = useMemoizedFn(() => {
    if (!htmlToImageTaskRef.current) {
      htmlToImageTaskRef.current = import("html-to-image").catch((error: unknown) => {
        htmlToImageTaskRef.current = null;
        throw error;
      });
    }

    return htmlToImageTaskRef.current;
  });

  const copyScreenshot = useMemoizedFn(async () => {
    setScreenshotStatus("copying");
    setScreenshotMessage("");

    try {
      const { toBlob } = await loadHtmlToImage();
      const targetNode = document.documentElement;
      const width = Math.max(document.documentElement.scrollWidth, window.innerWidth);
      const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const blob = await toBlob(targetNode, {
        width,
        height,
        pixelRatio: Math.min((window.devicePixelRatio ?? 1) * 0.9, 2),
      });

      if (!blob) {
        throw new Error("capture_failed");
      }

      const clipboardItem = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([clipboardItem]);
      setScreenshotStatus("done");
      setScreenshotMessage(t("actions.copyScreenshotSuccess"));
      window.setTimeout(() => {
        setScreenshotStatus("idle");
        setScreenshotMessage("");
      }, 2000);
    } catch (error: unknown) {
      setScreenshotStatus("error");
      setScreenshotMessage(t("actions.copyScreenshotError"));
      setTimeout(() => {
        setScreenshotStatus("idle");
      }, 2000);
      console.error(error);
    }
  });

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-12">
        <header className="flex flex-col gap-3 border-b pb-6">
          <p className="text-sm font-medium text-muted-foreground">{t("app.kicker")}</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {t("app.title")}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {t("app.description")}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <Button
                id="guide-button"
                className="w-full gap-2 md:w-auto"
                onClick={startGuide}
                variant="secondary"
              >
                <Play className="size-4" />
                {t("actions.startGuide")}
              </Button>
              <Button
                id="demo-screenshot-button"
                className="w-full gap-2 md:w-auto"
                variant="default"
                onClick={copyScreenshot}
                onMouseEnter={() => {
                  void loadHtmlToImage();
                }}
                onFocus={() => {
                  void loadHtmlToImage();
                }}
                disabled={screenshotStatus === "copying"}
              >
                {screenshotStatus === "copying" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                {screenshotStatus === "done"
                  ? t("actions.copyScreenshotDone")
                  : t("actions.copyScreenshot")}
              </Button>
            </div>
          </div>
        </header>
        {screenshotMessage ? (
          <p
            className={`text-sm ${
              screenshotStatus === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {screenshotMessage}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <section
            id="language-card"
            className="rounded-lg border bg-card p-5 text-card-foreground"
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t("language.title")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("language.description")}</p>
            </div>
            <div className="mt-5">
              <Label htmlFor="language-select">{t("language.current")}</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                <SelectTrigger id="language-select" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section id="theme-card" className="rounded-lg border bg-card p-5 text-card-foreground">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t("theme.title")}</h2>
              <p className="text-sm leading-6 text-muted-foreground" suppressHydrationWarning>
                {t("theme.active", { theme: activeThemeLabel })}
              </p>
            </div>
            <RadioGroup value={theme ?? "system"} onValueChange={setTheme} className="mt-5 gap-3">
              {themeOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.value}
                    className="flex h-10 items-center gap-3 rounded-md border px-3"
                  >
                    <RadioGroupItem id={`theme-${item.value}`} value={item.value} />
                    <Label
                      className="flex flex-1 cursor-pointer items-center gap-3"
                      htmlFor={`theme-${item.value}`}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {t(item.labelKey)}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </section>

          <section id="request-card" className="rounded-lg border bg-card p-5 text-card-foreground">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">{t("request.title")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("request.description")}</p>
            </div>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              onClick={() => demoRequest.mutate()}
              disabled={demoRequest.isPending}
            >
              {demoRequest.isPending ? t("request.loading") : t("request.run")}
            </Button>
            {demoRequest.data ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs leading-5">
                {JSON.stringify(demoRequest.data, null, 2)}
              </pre>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
