import { atom } from "jotai";

import { defaultLanguage, supportedLanguages, type SupportedLanguage } from "@/i18n/constants";

export type Language = SupportedLanguage;

export function isSupportedLanguage(value: string | null): value is Language {
  return supportedLanguages.includes(value as Language);
}

const baseLanguageAtom = atom<Language>(defaultLanguage);

export const languageAtom = atom(
  (get) => get(baseLanguageAtom),
  (_get, set, nextLanguage: Language) => {
    set(baseLanguageAtom, nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("language", nextLanguage);
    }
  },
);
