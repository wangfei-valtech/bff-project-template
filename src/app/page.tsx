"use client";

import Link from "next/link";
import { ArrowRight, Layers, Languages, MoonStar } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: Layers,
    key: "engineering",
  },
  {
    icon: Languages,
    key: "i18n",
  },
  {
    icon: MoonStar,
    key: "theme",
  },
] as const;

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center gap-10 px-5 py-10 sm:px-8">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-medium text-muted-foreground">{t("home.kicker")}</p>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{t("home.title")}</h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {t("home.description")}
          </p>
          <Button asChild className="gap-2">
            <Link href="/demo">
              {t("home.cta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <section
                key={item.key}
                className="rounded-lg border bg-card p-5 text-card-foreground"
              >
                <Icon className="mb-4 size-5 text-primary" />
                <h2 className="text-base font-semibold">
                  {t(`home.highlights.${item.key}.title`)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`home.highlights.${item.key}.description`)}
                </p>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
