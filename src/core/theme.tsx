"use client";
import { useEffect, useSyncExternalStore } from "react";
import { systemThemeMediaQuery, themeStorageKey } from "@/core/theme-init";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const themeChangeEvent = "themechange";

/** 判断存储值是否为受支持的主题偏好。 */
function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** 读取浏览器通过媒体查询暴露的当前主题。 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(systemThemeMediaQuery).matches ? "dark" : "light";
}

/** 读取已保存的主题偏好，无有效值时默认跟随系统。 */
function readTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  return isValidTheme(storedTheme) ? storedTheme : "system";
}

/** 将主题偏好解析为当前实际生效的浅色或深色主题。 */
function readResolvedTheme(): ResolvedTheme {
  const theme = readTheme();
  return theme === "system" ? getSystemTheme() : theme;
}

/** 订阅本页、跨标签页及浏览器主题变化。 */
function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  /** 处理其他标签页写入的主题偏好。 */
  const onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey) {
      callback();
    }
  };
  /** 处理当前页面主动触发的主题变化。 */
  const onThemeChange = () => callback();
  const mediaQuery = window.matchMedia(systemThemeMediaQuery);
  /** 处理浏览器主题偏好的动态变化。 */
  const onMediaChange = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(themeChangeEvent, onThemeChange);
  mediaQuery.addEventListener("change", onMediaChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(themeChangeEvent, onThemeChange);
    mediaQuery.removeEventListener("change", onMediaChange);
  };
}

/** 将指定主题应用到根元素的类名和原生控件配色。 */
function applyThemeToDocument(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.style.colorScheme = resolvedTheme;
}

/** 通知当前页面中的主题订阅者重新读取主题。 */
function emitThemeChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}

/** 在 React 启动后同步文档主题，并持续监听后续变化。 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /** 将当前主题偏好同步到文档根元素。 */
    const syncTheme = () => applyThemeToDocument(readTheme());

    syncTheme();
    return subscribe(syncTheme);
  }, []);

  return <>{children}</>;
}

/** 返回主题偏好、实际生效主题及主题更新方法。 */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, (): Theme => "system");
  const resolvedTheme = useSyncExternalStore<ResolvedTheme | undefined>(
    subscribe,
    readResolvedTheme,
    () => undefined,
  );

  /** 保存并立即应用新的主题偏好。 */
  const setTheme = (nextTheme: Theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(themeStorageKey, nextTheme);
      applyThemeToDocument(nextTheme);
      emitThemeChange();
    }
  };

  return {
    resolvedTheme,
    setTheme,
    theme,
  };
}
