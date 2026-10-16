"use client";

import { useLocale } from "@/i18n/locale-provider";

import { intlLocales } from "@/i18n/messages";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function HeaderClock() {
  const { locale, t } = useLocale();
  const weekdayFormat = new Intl.DateTimeFormat(intlLocales[locale], {
    weekday: "long",
  });
  const dateFormat = new Intl.DateTimeFormat(intlLocales[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormat = new Intl.DateTimeFormat(intlLocales[locale], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep server HTML and the first client render identical across time zones.
  if (!now) {
    return (
      <span className="header-clock" aria-label={t("loadingClock")}>
        <span className="header-clock__weekday">{t("today")}</span>
        <span className="header-clock__details">— · —:—:—</span>
      </span>
    );
  }

  return (
    <time
      className="header-clock"
      dateTime={now.toISOString()}
      aria-label={t("currentTime")}
    >
      <span className="header-clock__weekday">{weekdayFormat.format(now)}</span>
      <span className="header-clock__details">
        <span>{dateFormat.format(now)}</span>
        <span className="header-clock__time">
          <Clock3 size={15} aria-hidden="true" />
          {timeFormat.format(now)}
        </span>
      </span>
    </time>
  );
}
