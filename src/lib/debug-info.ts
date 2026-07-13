export type DebugValue = boolean | number | string | null;

export interface ClientDebugInfo {
  browser: Record<string, DebugValue>;
  collectedAt: string;
  connection: Record<string, DebugValue>;
  device: Record<string, DebugValue>;
  locale: Record<string, DebugValue>;
  preferences: Record<string, DebugValue>;
  runtime: Record<string, DebugValue>;
  system: Record<string, DebugValue>;
}

export interface NetworkDebugInfo {
  collectedAt: string;
  ip: {
    address: string | null;
    source: "cloudflare" | "proxy" | "unavailable" | "vercel";
    version: 4 | 6 | null;
  };
  location: {
    city: string | null;
    continent: string | null;
    country: string | null;
    latitude: string | null;
    longitude: string | null;
    postalCode: string | null;
    region: string | null;
    regionCode: string | null;
    timezone: string | null;
  };
}

interface NavigatorUADataLike {
  brands: Array<{ brand: string; version: string }>;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
  mobile: boolean;
  platform: string;
}

interface NetworkInformationLike {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

type NavigatorWithDiagnostics = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
  globalPrivacyControl?: boolean;
  userAgentData?: NavigatorUADataLike;
};

export interface UserAgentSummary {
  browserName: string;
  browserVersion: string | null;
  kernel: string;
  osName: string;
  osVersion: string | null;
}

/** 对常见浏览器 UA 做保守解析，供不支持 UA Client Hints 的环境回退使用。 */
export function parseUserAgent(userAgent: string): UserAgentSummary {
  const browserPatterns = [
    { kernel: "Blink", name: "Microsoft Edge", pattern: /Edg\/(\d+(?:\.\d+)*)/ },
    { kernel: "Blink", name: "Opera", pattern: /OPR\/(\d+(?:\.\d+)*)/ },
    { kernel: "Blink", name: "Chrome", pattern: /(?:Chrome|CriOS)\/(\d+(?:\.\d+)*)/ },
    { kernel: "Gecko", name: "Firefox", pattern: /(?:Firefox|FxiOS)\/(\d+(?:\.\d+)*)/ },
    {
      kernel: "WebKit",
      name: "Safari",
      pattern: /Version\/(\d+(?:\.\d+)*).+Safari/,
    },
  ];
  const browser = browserPatterns.find((item) => item.pattern.test(userAgent));
  const browserMatch = browser?.pattern.exec(userAgent);

  const osPatterns = [
    { name: "Windows", pattern: /Windows NT ([\d.]+)/ },
    { name: "Android", pattern: /Android ([\d.]+)/ },
    { name: "iOS", pattern: /(?:iPhone OS|CPU OS) ([\d_]+)/ },
    { name: "ChromeOS", pattern: /CrOS [^ ]+ ([\d.]+)/ },
    { name: "macOS", pattern: /Mac OS X ([\d_]+)/ },
  ];
  const os = osPatterns.find((item) => item.pattern.test(userAgent));
  const osMatch = os?.pattern.exec(userAgent);
  const linux = /Linux/.test(userAgent);

  return {
    browserName: browser?.name ?? "Unknown",
    browserVersion: browserMatch?.[1] ?? null,
    kernel: browser?.kernel ?? "Unknown",
    osName: os?.name ?? (linux ? "Linux" : "Unknown"),
    osVersion: osMatch?.[1]?.replaceAll("_", ".") ?? null,
  };
}

/** 遮罩公网 IP，降低截图或录屏意外泄露个人信息的风险。 */
export function maskIpAddress(address: string | null): string | null {
  if (!address) {
    return null;
  }

  if (address.includes(".")) {
    const parts = address.split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.*` : "***";
  }

  const visible = address.split(":").filter(Boolean).slice(0, 3).join(":");
  return visible ? `${visible}:…` : "***";
}

function supportsStorage(storage: Storage) {
  const key = "__debug_storage_probe__";
  try {
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function supportsWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function mediaMatches(query: string) {
  return window.matchMedia(query).matches;
}

function formatUtcOffset(offsetMinutes: number) {
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const hours = Math.floor(absolute / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absolute % 60).toString().padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}

/** 在浏览器中采集非内容型、非持久化的排障信息。 */
export async function collectClientDebugInfo(): Promise<ClientDebugInfo> {
  const nav = navigator as NavigatorWithDiagnostics;
  const uaSummary = parseUserAgent(nav.userAgent);
  const uaData = nav.userAgentData;
  let highEntropy: Record<string, unknown> = {};

  if (uaData?.getHighEntropyValues) {
    try {
      highEntropy = await uaData.getHighEntropyValues([
        "architecture",
        "bitness",
        "formFactors",
        "fullVersionList",
        "model",
        "platformVersion",
      ]);
    } catch {
      highEntropy = {};
    }
  }

  const brands = Array.isArray(highEntropy.fullVersionList)
    ? highEntropy.fullVersionList
    : uaData?.brands;
  const primaryBrand = Array.isArray(brands)
    ? brands.find((item) => {
        return typeof item === "object" && item !== null && !String(item.brand).includes("Not");
      })
    : undefined;
  const connection = nav.connection;
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  const storageEstimate = navigator.storage?.estimate
    ? await navigator.storage.estimate().catch(() => undefined)
    : undefined;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const mobile = uaData?.mobile ?? /Mobi|Android|iPhone|iPad/i.test(nav.userAgent);
  const deviceClass = mobile
    ? Math.min(screen.width, screen.height) >= 768
      ? "tablet"
      : "mobile"
    : "desktop";
  const browserName =
    primaryBrand && "brand" in primaryBrand ? String(primaryBrand.brand) : uaSummary.browserName;
  const browserVersion =
    primaryBrand && "version" in primaryBrand
      ? String(primaryBrand.version)
      : uaSummary.browserVersion;
  const appTheme = window.localStorage.getItem("theme") ?? "system";
  const collectedAt = new Date();
  const displayMode = mediaMatches("(display-mode: standalone)") ? "standalone" : "browser";

  return {
    browser: {
      brands: brands ? JSON.stringify(brands) : null,
      cookiesEnabled: nav.cookieEnabled,
      crossOriginIsolated: window.crossOriginIsolated,
      doNotTrack: nav.doNotTrack || null,
      globalPrivacyControl: nav.globalPrivacyControl ?? null,
      kernel: uaSummary.kernel,
      language: nav.language,
      languages: nav.languages?.join(", ") ?? null,
      mobile,
      name: browserName,
      pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
      secureContext: window.isSecureContext,
      userAgent: nav.userAgent,
      version: browserVersion,
      webdriver: nav.webdriver,
    },
    collectedAt: collectedAt.toISOString(),
    connection: {
      downlink: connection?.downlink ?? null,
      effectiveType: connection?.effectiveType ?? null,
      online: nav.onLine,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? null,
      type: connection?.type ?? null,
    },
    device: {
      availableScreen: `${screen.availWidth} × ${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      deviceClass,
      deviceId: null,
      deviceMemory: nav.deviceMemory ?? null,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: nav.hardwareConcurrency || null,
      maxTouchPoints: nav.maxTouchPoints,
      orientation:
        screen.orientation?.type ?? (viewportWidth > viewportHeight ? "landscape" : "portrait"),
      physicalViewport: `${Math.round(viewportWidth * window.devicePixelRatio)} × ${Math.round(viewportHeight * window.devicePixelRatio)}`,
      pixelDepth: screen.pixelDepth,
      screen: `${screen.width} × ${screen.height}`,
      touchCapable: nav.maxTouchPoints > 0 || "ontouchstart" in window,
      viewport: `${viewportWidth} × ${viewportHeight}`,
    },
    locale: {
      clientTime: collectedAt.toLocaleString(),
      dateExample: new Intl.DateTimeFormat().format(collectedAt),
      direction: document.documentElement.dir || "ltr",
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      numberExample: new Intl.NumberFormat().format(1234567.89),
      pageLanguage: document.documentElement.lang || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: formatUtcOffset(collectedAt.getTimezoneOffset()),
    },
    preferences: {
      appTheme,
      browserTheme: mediaMatches("(prefers-color-scheme: dark)") ? "dark" : "light",
      forcedColors: mediaMatches("(forced-colors: active)"),
      prefersContrast: mediaMatches("(prefers-contrast: more)"),
      reducedMotion: mediaMatches("(prefers-reduced-motion: reduce)"),
      reducedTransparency: mediaMatches("(prefers-reduced-transparency: reduce)"),
      resolvedTheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    },
    runtime: {
      buildSha: document.querySelector<HTMLMetaElement>('meta[http-equiv="etag"]')?.content || null,
      displayMode,
      domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      indexedDbSupported: "indexedDB" in window,
      loadTime: navigation ? Math.round(navigation.loadEventEnd) : null,
      localStorageAvailable: supportsStorage(window.localStorage),
      navigationType: navigation?.type ?? null,
      origin: window.location.origin,
      pathname: window.location.pathname,
      protocol: window.location.protocol.replace(":", "").toUpperCase(),
      serviceWorkerSupported: "serviceWorker" in navigator,
      sessionStorageAvailable: supportsStorage(window.sessionStorage),
      storageQuota: storageEstimate?.quota ?? null,
      storageUsage: storageEstimate?.usage ?? null,
      visibility: document.visibilityState,
      webGlSupported: supportsWebGl(),
      webGpuSupported: "gpu" in navigator,
    },
    system: {
      architecture: typeof highEntropy.architecture === "string" ? highEntropy.architecture : null,
      bitness: typeof highEntropy.bitness === "string" ? highEntropy.bitness : null,
      model: typeof highEntropy.model === "string" && highEntropy.model ? highEntropy.model : null,
      name: uaData?.platform || uaSummary.osName,
      platform: nav.platform || null,
      version:
        typeof highEntropy.platformVersion === "string"
          ? highEntropy.platformVersion
          : uaSummary.osVersion,
    },
  };
}
