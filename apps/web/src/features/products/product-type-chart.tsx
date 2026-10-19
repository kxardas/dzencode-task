"use client";

import { useLocale } from "@/i18n/locale-provider";
import type { Product } from "./types";

export default function ProductTypeChart({
  products,
}: {
  products: Product[];
}) {
  const { locale, t } = useLocale();
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.type, (counts.get(product.type) ?? 0) + 1);
  }
  const rows = Array.from(counts, ([type, count]) => ({ type, count })).sort(
    (first, second) =>
      second.count - first.count ||
      first.type.localeCompare(second.type, locale),
  );
  const maximum = rows[0]?.count ?? 1;

  return (
    <figure className="product-type-chart">
      <figcaption className="product-type-chart__title">
        {t("productsByType")}
      </figcaption>
      <p className="product-type-chart__total">
        {t("statisticsTotal", { count: products.length })}
      </p>
      {products.length === 0 ? (
        <p className="mb-0">{t("statisticsEmpty")}</p>
      ) : (
        <dl className="product-type-chart__rows">
          {rows.map(({ type, count }) => (
            <div className="product-type-chart__row" key={type}>
              <dt className="product-type-chart__label">{type}</dt>
              <dd className="product-type-chart__value">
                <span className="product-type-chart__track" aria-hidden="true">
                  <span
                    className="product-type-chart__bar"
                    style={{ width: `${(count / maximum) * 100}%` }}
                  />
                </span>
                <span className="product-type-chart__count">{count}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}
