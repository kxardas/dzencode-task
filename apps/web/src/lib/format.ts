import { intlLocales, type Locale } from "@/i18n/messages";

export function formatShortDate(value: string, locale: Locale = "ru"): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatFullDate(value: string, locale: Locale = "ru"): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatPrice(
  value: string,
  currency: "USD" | "UAH",
  locale: Locale = "ru",
): string {
  return new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
