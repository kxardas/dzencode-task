"use client";

import { useLocale } from "@/i18n/locale-provider";

import { Package } from "lucide-react";
import { useState } from "react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { useGetProductsQuery } from "@/store/api";
import { ProductRow } from "./product-row";
import { ProductStatistics } from "./product-statistics";

export function ProductsList() {
  const { locale, t } = useLocale();
  const [selectedType, setSelectedType] = useState("");
  const allProductsQuery = useGetProductsQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });
  const filteredProductsQuery = useGetProductsQuery(selectedType, {
    skip: selectedType === "",
  });
  const {
    currentData: products,
    isFetching,
    isError,
    refetch,
  } = selectedType ? filteredProductsQuery : allProductsQuery;
  const types = Array.from(
    new Set(allProductsQuery.data?.map((product) => product.type) ?? []),
  );
  if (selectedType && !types.includes(selectedType)) types.push(selectedType);
  types.sort((first, second) => first.localeCompare(second, locale));

  return (
    <section className="inventory-page" aria-labelledby="products-title">
      <div className="inventory-page__heading">
        <h1 className="inventory-page__title" id="products-title">
          {t("products")}
          {products !== undefined && ` / ${products.length}`}
        </h1>
        <p className="inventory-page__description mb-0">
          {t("productsDescription")}
        </p>
      </div>
      <div className="products-filter">
        <label className="products-filter__label" htmlFor="products-type">
          {t("productType")}
        </label>
        <select
          id="products-type"
          className="products-filter__select form-select"
          value={selectedType}
          disabled={allProductsQuery.data === undefined}
          onChange={(event) => setSelectedType(event.target.value)}
        >
          <option value="">{t("allTypes")}</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <ProductStatistics
        products={allProductsQuery.data}
        isFetching={allProductsQuery.isFetching}
        isError={allProductsQuery.isError}
      />

      {isFetching && products === undefined && (
        <div className="products-state" role="status">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          <span>{t("loadingProducts")}</span>
        </div>
      )}
      {isError && (
        <div className="products-error" role="alert">
          <p className="mb-2">{t("productsError")}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? t("retrying") : t("retry")}
          </button>
        </div>
      )}
      {isFetching && products !== undefined && (
        <p className="products-refresh" role="status">
          {t("refreshingProducts")}
        </p>
      )}
      {products !== undefined &&
        (products.length === 0 ? (
          <PagePlaceholder
            icon={<Package size={32} strokeWidth={1.5} />}
            title={selectedType ? t("noFilteredProducts") : t("noProducts")}
            description={
              selectedType ? t("resetFilterHint") : t("noProductsDescription")
            }
          />
        ) : (
          <ul
            className="products-list list-unstyled mb-0"
            aria-label={t("productsList")}
            aria-busy={isFetching}
          >
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </ul>
        ))}
    </section>
  );
}
