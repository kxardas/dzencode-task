"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

const weekdayFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep server HTML and the first client render identical across time zones.
  if (!now) {
    return (
      <span className="header-clock" aria-label="Загрузка даты и времени">
        <span className="header-clock__weekday">Сегодня</span>
        <span className="header-clock__details">— · —:—:—</span>
      </span>
    );
  }

  return (
    <time
      className="header-clock"
      dateTime={now.toISOString()}
      aria-label="Текущие дата и время"
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
