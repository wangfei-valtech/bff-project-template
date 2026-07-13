"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { VersionUpdateNotifier } from "@/components/version-update-notifier";
import i18n from "@/i18n/client";
import { isSupportedLanguage, languageAtom } from "@/core/state/language";
import { ThemeProvider } from "@/core/theme";

function LanguageBootstrap({ children }: { children: React.ReactNode }) {
  const language = useAtomValue(languageAtom);
  const setLanguage = useSetAtom(languageAtom);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("language");

    if (isSupportedLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, [setLanguage]);

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  return children;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <JotaiProvider>
      <LanguageBootstrap>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {children}
            <VersionUpdateNotifier />
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </LanguageBootstrap>
    </JotaiProvider>
  );
}
