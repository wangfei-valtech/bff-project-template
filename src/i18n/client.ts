import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultLanguage } from "@/i18n/constants";
import enUs from "@/i18n/resources/en-US.json";
import zhCn from "@/i18n/resources/zh-CN.json";

const resources = {
  "zh-CN": {
    translation: zhCn,
  },
  "en-US": {
    translation: enUs,
  },
};

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    defaultNS: "translation",
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
    lng: defaultLanguage,
    resources,
  });
}

export default i18next;
