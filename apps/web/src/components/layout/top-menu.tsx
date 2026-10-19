"use client";

import { useLocale } from "@/i18n/locale-provider";
import { LanguageSelect } from "@/i18n/language-select";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HeaderClock } from "./header-clock";
import { SessionCounter } from "./session-counter";
import { AuthControls } from "@/features/auth/auth-controls";

export function TopMenu() {
  const { t } = useLocale();
  return (
    <header className="top-menu d-flex align-items-center justify-content-between">
      <Link
        className="top-menu__brand d-inline-flex align-items-center gap-2"
        href="/orders"
        aria-label={t("brand")}
      >
        <ShieldCheck size={36} strokeWidth={1.8} aria-hidden="true" />
        <span>Inventory</span>
      </Link>
      <div className="top-menu__status">
        <HeaderClock />
        <SessionCounter />
        <LanguageSelect />
        <AuthControls />
      </div>
    </header>
  );
}
