const shortDate = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const fullDate = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatShortDate(value: string): string {
  return shortDate.format(new Date(value));
}

export function formatFullDate(value: string): string {
  return fullDate.format(new Date(value));
}

export function formatPrice(value: string, currency: "USD" | "UAH"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
