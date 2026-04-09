"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconUser, IconBuilding, IconBuildingSkyscraper, IconArrowRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

export default function ComparisonsPage() {
  const t = useTranslations("AdminAnalyticsComparisonsPage");

  const options = [
    {
      key: "staff",
      href: "/admin/analytics/comparisons/staff",
      icon: <IconUser size={32} className="text-blue-500" />,
      title: t("staffTitle"),
      description: t("staffDesc"),
    },
    {
      key: "unit",
      href: "/admin/analytics/comparisons/unit",
      icon: <IconBuilding size={32} className="text-violet-500" />,
      title: t("unitTitle"),
      description: t("unitDesc"),
    },
    {
      key: "organisation",
      href: "/admin/analytics/comparisons/organisation",
      icon: <IconBuildingSkyscraper size={32} className="text-emerald-500" />,
      title: t("organisationTitle"),
      description: t("organisationDesc"),
    },
  ];

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <IconChevronLeft size={16} />
            {t("backToAnalytics")}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {options.map((opt) => (
          <Card key={opt.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="mb-2">{opt.icon}</div>
              <CardTitle className="text-lg">{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={opt.href}>
                <Button className="w-full gap-2">
                  {t("openButton")} <IconArrowRight size={16} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
