"use client";

import { lazy, Suspense, useState } from "react";
import { ChartNoAxesColumn, ChevronDown } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import type { Product } from "./types";

const ProductTypeChart = lazy(() => import("./product-type-chart"));

interface ProductStatisticsProps {
  products: Product[] | undefined;
  isFetching: boolean;
  isError: boolean;
}

export function ProductStatistics({
  products,
  isFetching,
  isError,
}: ProductStatisticsProps) {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      className="product-statistics"
      aria-label={t("inventoryStatistics")}
    >
      <button
        type="button"
        className="product-statistics__toggle"
        aria-expanded={isOpen}
        aria-controls="product-statistics-panel"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChartNoAxesColumn size={20} aria-hidden="true" />
        <span>{t("inventoryStatistics")}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      <div id="product-statistics-panel" hidden={!isOpen}>
        {isOpen && (
          <div className="product-statistics__content">
            <p className="product-statistics__hint">{t("statisticsScope")}</p>
            {isError && (
              <p className="product-statistics__error" role="alert">
                {t("statisticsError")}
              </p>
            )}
            {isFetching && (
              <p role="status">
                {t(
                  products === undefined
                    ? "loadingProducts"
                    : "refreshingProducts",
                )}
              </p>
            )}
            {products !== undefined && (
              <Suspense fallback={<p role="status">{t("loadingChart")}</p>}>
                <ProductTypeChart products={products} />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
