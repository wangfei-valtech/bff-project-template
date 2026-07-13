export const themeStorageKey = "theme";

// “跟随系统”读取的是浏览器暴露的偏好，并非直接读取操作系统设置。Chrome 的外观必须
// 设为“设备”；如果固定为浅色或深色，媒体查询会得到 Chrome 覆盖后的值。
export const systemThemeMediaQuery = "(prefers-color-scheme: dark)";

// 在页面绘制前应用主题，避免深色模式下先短暂显示服务端默认的浅色主题。
export const themeInitializationScript = `
(function () {
  var storedTheme = null;
  try {
    storedTheme = window.localStorage.getItem(${JSON.stringify(themeStorageKey)});
  } catch (_) {}
  var isDark = storedTheme === "dark" ||
    (storedTheme !== "light" && window.matchMedia(${JSON.stringify(systemThemeMediaQuery)}).matches);
  /* 在 hydration 完成前设置主题，避免水合后与服务端给的默认主题不一致而导致的“一闪”问题 */
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
})();
`;
