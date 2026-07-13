"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Check,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  Gauge,
  Globe2,
  LockKeyhole,
  MonitorCog,
  Network,
  Palette,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "@/app/debug/page.module.css";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/core/theme";
import {
  collectClientDebugInfo,
  maskIpAddress,
  type ClientDebugInfo,
  type DebugValue,
  type NetworkDebugInfo,
} from "@/lib/debug-info";
import { request } from "@/lib/request";

type SectionId =
  "browser" | "connection" | "device" | "locale" | "network" | "preferences" | "runtime" | "system";

interface DebugRow {
  key: string;
  sensitive?: boolean;
  value: DebugValue;
}

type CopyState = "copying" | "error" | "idle" | "success";

let screenshotLibraryPromise: Promise<typeof import("html-to-image")> | null = null;

function loadScreenshotLibrary() {
  screenshotLibraryPromise ??= import("html-to-image");
  return screenshotLibraryPromise;
}

function preloadScreenshotLibrary() {
  void loadScreenshotLibrary();
}

const sectionDefinitions = [
  { icon: Network, id: "network" },
  { icon: Smartphone, id: "device" },
  { icon: Globe2, id: "browser" },
  { icon: MonitorCog, id: "system" },
  { icon: Palette, id: "preferences" },
  { icon: Wifi, id: "connection" },
  { icon: Clock3, id: "locale" },
  { icon: Gauge, id: "runtime" },
] as const;

const sectionLabels: Record<SectionId, string> = {
  browser: "浏览器",
  connection: "网络连接",
  device: "屏幕与设备",
  locale: "时间与区域",
  network: "公网网络",
  preferences: "主题与偏好",
  runtime: "应用运行环境",
  system: "操作系统",
};

const summaryLabels: Record<string, string> = {
  browser: "浏览器",
  device: "设备",
  ip: "公网 IP",
  online: "连接状态",
  os: "操作系统",
  theme: "当前主题",
};

const fieldLabels: Record<string, string> = {
  appTheme: "页面主题设置",
  architecture: "CPU 架构",
  availableScreen: "可用屏幕尺寸",
  bitness: "系统位数",
  brands: "UA 品牌列表",
  browserTheme: "浏览器配色偏好",
  buildSha: "HTML ETag 构建 SHA",
  city: "城市",
  clientTime: "客户端时间",
  colorDepth: "色彩深度",
  continent: "洲",
  cookiesEnabled: "Cookie 能力",
  coordinates: "IP 估算经纬度",
  country: "国家/地区",
  crossOriginIsolated: "跨域隔离",
  dateExample: "日期格式示例",
  deviceClass: "设备分类",
  deviceId: "硬件设备 ID",
  deviceMemory: "估算设备内存（GB）",
  devicePixelRatio: "设备像素比",
  direction: "文本方向",
  displayMode: "页面显示模式",
  doNotTrack: "Do Not Track",
  domContentLoaded: "DOM Ready（ms）",
  downlink: "估算下行速度（Mbps）",
  effectiveType: "有效连接等级",
  forcedColors: "强制颜色模式",
  globalPrivacyControl: "Global Privacy Control",
  hardwareConcurrency: "逻辑 CPU 核数",
  indexedDbSupported: "IndexedDB 支持",
  ipAddress: "公网 IP",
  ipSource: "IP 信息来源",
  ipVersion: "IP 类型",
  kernel: "浏览器内核",
  language: "浏览器语言",
  languages: "首选语言列表",
  loadTime: "页面加载时间（ms）",
  localStorageAvailable: "LocalStorage 可用",
  locale: "Locale",
  maxTouchPoints: "最大触摸点数",
  mobile: "移动端标识",
  model: "设备型号",
  name: "名称",
  navigationType: "页面加载类型",
  numberExample: "数字格式示例",
  online: "在线状态",
  orientation: "屏幕方向",
  origin: "页面 Origin",
  pageLanguage: "页面语言",
  pathname: "页面路径",
  pdfViewerEnabled: "PDF 查看能力",
  physicalViewport: "推算物理视口",
  pixelDepth: "像素深度",
  platform: "系统平台",
  postalCode: "邮政编码",
  prefersContrast: "高对比度偏好",
  protocol: "访问协议",
  reducedMotion: "减少动画偏好",
  reducedTransparency: "减少透明度偏好",
  region: "省/州/地区",
  resolvedTheme: "页面实际主题",
  rtt: "估算 RTT（ms）",
  saveData: "省流量模式",
  screen: "屏幕分辨率",
  secureContext: "安全上下文",
  serverCollectedAt: "服务端采集时间",
  serviceWorkerSupported: "Service Worker 支持",
  sessionStorageAvailable: "SessionStorage 可用",
  storageQuota: "存储配额",
  storageUsage: "存储已用空间",
  timezone: "时区",
  touchCapable: "触摸能力",
  type: "连接类型",
  userAgent: "完整 User-Agent",
  utcOffset: "UTC 偏移",
  version: "版本",
  viewport: "当前视口尺寸",
  visibility: "页面可见状态",
  webGlSupported: "WebGL 支持",
  webGpuSupported: "WebGPU 支持",
  webdriver: "自动化环境标识",
};

function formatBytes(value: DebugValue) {
  if (typeof value !== "number") {
    return value;
  }
  if (value < 1024) {
    return `${value} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let size = value;
  let unit = -1;
  do {
    size /= 1024;
    unit += 1;
  } while (size >= 1024 && unit < units.length - 1);
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unit]}`;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

/** 展示用于线上自助排障的浏览器与请求环境诊断信息。 */
export default function DebugPage() {
  const { resolvedTheme, theme } = useTheme();
  const pageRef = useRef<HTMLElement>(null);
  const [clientInfo, setClientInfo] = useState<ClientDebugInfo | null>(null);
  const [clientError, setClientError] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSensitive, setShowSensitive] = useState(true);

  const networkQuery = useQuery({
    queryFn: () => request<NetworkDebugInfo>("/napi/debug-info"),
    queryKey: ["debug-info", refreshKey],
    retry: 1,
    staleTime: 0,
  });

  useEffect(() => {
    let active = true;
    void collectClientDebugInfo()
      .then((result) => {
        if (active) {
          setClientInfo(result);
          setClientError(false);
        }
      })
      .catch(() => {
        if (active) {
          setClientError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [refreshKey, resolvedTheme, theme]);

  useEffect(() => {
    const refresh = () => {
      setClientError(false);
      setRefreshKey((value) => value + 1);
    };
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("orientationchange", refresh);
    window.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("orientationchange", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, []);

  useEffect(() => {
    if (copyState !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => setCopyState("idle"), 3_000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const refresh = useCallback(() => {
    setClientError(false);
    setRefreshKey((value) => value + 1);
  }, []);

  const copyScreenshot = useCallback(async () => {
    const page = pageRef.current;
    const canWriteImage = typeof ClipboardItem !== "undefined" && navigator.clipboard?.write;
    if (!page || !canWriteImage) {
      setCopyState("error");
      return;
    }

    const restoreSensitiveState = showSensitive;
    setCopyState("copying");
    setShowSensitive(true);

    try {
      const imagePromise = (async () => {
        await waitForNextPaint();
        const { toBlob } = await loadScreenshotLibrary();
        const width = page.scrollWidth;
        const height = page.scrollHeight;
        const maximumPixels = 18_000_000;
        const idealRatio = Math.min(window.devicePixelRatio || 1, 2);
        const safeRatio = Math.min(idealRatio, Math.sqrt(maximumPixels / (width * height)));
        const blob = await toBlob(page, {
          backgroundColor: getComputedStyle(page).backgroundColor,
          cacheBust: true,
          height,
          pixelRatio: Math.max(safeRatio, 0.75),
          width,
        });
        if (!blob) {
          throw new Error("Screenshot generation returned an empty image");
        }
        return blob;
      })();

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": imagePromise,
        }),
      ]);
      setCopyState("success");
    } catch {
      setCopyState("error");
    } finally {
      if (!restoreSensitiveState) {
        setShowSensitive(false);
      }
    }
  }, [showSensitive]);
  const network = networkQuery.data;

  const sections = useMemo<Record<SectionId, DebugRow[]>>(() => {
    const location = network?.location;
    return {
      browser: Object.entries(clientInfo?.browser ?? {}).map(([key, value]) => ({ key, value })),
      connection: Object.entries(clientInfo?.connection ?? {}).map(([key, value]) => ({
        key,
        value,
      })),
      device: Object.entries(clientInfo?.device ?? {}).map(([key, value]) => ({ key, value })),
      locale: Object.entries(clientInfo?.locale ?? {}).map(([key, value]) => ({ key, value })),
      network: [
        {
          key: "ipAddress",
          sensitive: true,
          value: showSensitive
            ? (network?.ip.address ?? null)
            : maskIpAddress(network?.ip.address ?? null),
        },
        { key: "ipVersion", value: network?.ip.version ?? null },
        { key: "ipSource", value: network?.ip.source ?? null },
        { key: "continent", value: location?.continent ?? null },
        { key: "country", value: location?.country ?? null },
        { key: "region", sensitive: true, value: location?.region ?? location?.regionCode ?? null },
        { key: "city", sensitive: true, value: location?.city ?? null },
        { key: "timezone", value: location?.timezone ?? null },
        { key: "postalCode", sensitive: true, value: location?.postalCode ?? null },
        {
          key: "coordinates",
          sensitive: true,
          value:
            location?.latitude && location.longitude
              ? `${location.latitude}, ${location.longitude}`
              : null,
        },
        { key: "serverCollectedAt", value: network?.collectedAt ?? null },
      ],
      preferences: Object.entries(clientInfo?.preferences ?? {}).map(([key, value]) => ({
        key,
        value,
      })),
      runtime: Object.entries(clientInfo?.runtime ?? {}).map(([key, value]) => ({
        key,
        value: key === "storageQuota" || key === "storageUsage" ? formatBytes(value) : value,
      })),
      system: Object.entries(clientInfo?.system ?? {}).map(([key, value]) => ({ key, value })),
    };
  }, [clientInfo, network, showSensitive]);

  const summary: Array<{ detail?: DebugValue; key: string; value: DebugValue | undefined }> = [
    { key: "ip", value: maskIpAddress(network?.ip.address ?? null) },
    { key: "device", value: clientInfo?.device.deviceClass },
    {
      detail: clientInfo?.browser.version,
      key: "browser",
      value: clientInfo?.browser.name,
    },
    {
      detail: clientInfo?.system.version,
      key: "os",
      value: clientInfo?.system.name,
    },
    { key: "theme", value: clientInfo?.preferences.resolvedTheme },
    { key: "online", value: clientInfo?.connection.online },
  ];

  const renderValue = (value: DebugValue | undefined) => {
    if (value === null || value === undefined || value === "") {
      return "当前环境未提供";
    }
    if (typeof value === "boolean") {
      return value ? "是" : "否";
    }
    return String(value);
  };

  return (
    <main ref={pageRef} className={`${styles.surface} min-h-dvh bg-background text-foreground`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7 lg:py-10">
        <header className="relative overflow-hidden rounded-2xl border bg-card/95 p-5 shadow-sm backdrop-blur sm:p-8">
          <div className={`${styles.scan} absolute inset-x-0 top-0 h-px`} />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Activity className="size-4" />
                实时环境检测
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">客户端诊断台</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                实时检查当前浏览器、设备与请求环境，帮助技术支持快速定位线上问题。
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                className="gap-2 font-mono text-xs"
                onClick={refresh}
                disabled={networkQuery.isFetching}
              >
                <RefreshCw className={`size-4 ${networkQuery.isFetching ? "animate-spin" : ""}`} />
                重新检测
              </Button>
              <Button
                className="gap-2 font-mono text-xs"
                onClick={() => void copyScreenshot()}
                onFocus={preloadScreenshotLibrary}
                onMouseEnter={preloadScreenshotLibrary}
                onTouchStart={preloadScreenshotLibrary}
                disabled={copyState === "copying"}
              >
                {copyState === "success" ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copyState === "copying"
                  ? "正在生成页面截图..."
                  : copyState === "success"
                    ? "页面截图已复制"
                    : copyState === "error"
                      ? "无法复制截图，请使用 HTTPS 或更新浏览器"
                      : "一键复制页面截图到剪切板"}
              </Button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3 xl:grid-cols-6">
            {summary.map((item) => (
              <div key={item.key} className={`${styles.signal} min-h-24 bg-card p-4`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {summaryLabels[item.key]}
                </p>
                <p className="mt-3 break-words font-mono text-sm font-semibold">
                  {renderValue(item.value)}
                </p>
                {item.detail ? (
                  <p className="mt-1 break-words font-mono text-[11px] text-muted-foreground">
                    版本 {renderValue(item.detail)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-xl border border-primary/35 bg-gradient-to-r from-primary/10 via-primary/5 to-card shadow-sm">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <ShieldCheck className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Privacy Guard Active
              </p>
              <h2 className="mt-1 text-base font-semibold sm:text-lg">
                隐私保护已启用，诊断信息只展示给您
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                页面只读取排障所需的环境能力。Cookie、令牌、存储内容、GPS 与硬件标识不会被读取。
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] font-medium">
                {["不会保存诊断信息", "不会发送给第三方", "不会读取敏感内容"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-2.5 py-1.5 text-foreground"
                  >
                    <Check className="size-3.5 text-emerald-500" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {clientError || networkQuery.isError ? (
          <section className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            部分信息暂时无法读取，其余诊断结果仍可继续使用。
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col" aria-label="诊断信息分类">
              {sectionDefinitions.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex shrink-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-4 text-primary" />
                    {sectionLabels[section.id]}
                  </a>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-5">
            {sectionDefinitions.map((section) => {
              const Icon = section.icon;
              const isNetwork = section.id === "network";
              return (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-6 overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <header className="flex items-center justify-between gap-4 border-b bg-muted/40 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-md border bg-background">
                        <Icon className="size-4 text-primary" />
                      </span>
                      <h2 className="font-semibold">{sectionLabels[section.id]}</h2>
                    </div>
                    {isNetwork ? (
                      <Button
                        variant="secondary"
                        className="h-8 gap-2 px-3 font-mono text-[11px]"
                        onClick={() => setShowSensitive((value) => !value)}
                      >
                        {showSensitive ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                        {showSensitive ? "隐藏敏感信息" : "显示敏感信息"}
                      </Button>
                    ) : null}
                  </header>
                  <dl className="grid sm:grid-cols-2 xl:grid-cols-3">
                    {sections[section.id].map((row) => {
                      const hidden = row.sensitive && !showSensitive && row.key !== "ipAddress";
                      return (
                        <div key={row.key} className="min-w-0 border-b p-4 sm:border-r sm:p-5">
                          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            {row.sensitive ? <LockKeyhole className="size-3" /> : null}
                            {fieldLabels[row.key] ?? row.key}
                          </dt>
                          <dd className="mt-2 break-words font-mono text-xs leading-5">
                            {hidden ? "••••••••" : renderValue(row.value)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
