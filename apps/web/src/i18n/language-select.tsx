"use client";

import { useLocale } from "./locale-provider";

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocale();
  return (
    <select
      className="language-select form-select form-select-sm"
      aria-label={t("language")}
      value={locale}
      onChange={(event) => setLocale(event.target.value === "uk" ? "uk" : "ru")}
    >
      <option value="ru">RU</option>
      <option value="uk">UK</option>
    </select>
  );
}
