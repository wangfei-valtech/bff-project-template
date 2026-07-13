import { defaultLanguage } from "@/i18n/constants";

type RequestOptions<TMock> = Omit<RequestInit, "headers"> & {
  baseUrl?: string;
  headers?: HeadersInit;
  mock?: TMock;
};

function getCurrentLanguage() {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  return window.localStorage.getItem("language") ?? defaultLanguage;
}

function getCurrentTheme() {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function buildHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers);
  const language = getCurrentLanguage();
  const theme = getCurrentTheme();

  if (language !== defaultLanguage) {
    nextHeaders.set("lang", language);
  }

  if (theme) {
    nextHeaders.set("theme", theme);
  }

  return nextHeaders;
}

export async function request<TResponse, TMock = TResponse>(
  input: string,
  options: RequestOptions<TMock> = {},
): Promise<TResponse | TMock> {
  const { baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "", headers, mock, ...init } = options;

  if (mock !== undefined) {
    return Promise.resolve(mock);
  }

  const response = await fetch(`${baseUrl}${input}`, {
    ...init,
    headers: buildHeaders(headers),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<TResponse>;
}
