"use client";

import { Package } from "lucide-react";
import { useState } from "react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { useGetProductsQuery } from "@/store/api";
import { ProductRow } from "./product-row";

export function ProductsList() {
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
  types.sort((first, second) => first.localeCompare(second, "ru"));

  return (
    <section className="inventory-page" aria-labelledby="products-title">
      <div className="inventory-page__heading">
        <h1 className="inventory-page__title" id="products-title">
          Продукты{products !== undefined && ` / ${products.length}`}
        </h1>
        <p className="inventory-page__description mb-0">
          Оборудование из всех приходов в одном месте.
        </p>
      </div>
      <div className="products-filter">
        <label className="products-filter__label" htmlFor="products-type">
          Тип продукта
        </label>
        <select
          id="products-type"
          className="products-filter__select form-select"
          value={selectedType}
          disabled={allProductsQuery.data === undefined}
          onChange={(event) => setSelectedType(event.target.value)}
        >
          <option value="">Все типы</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {isFetching && products === undefined && (
        <div className="products-state" role="status">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          <span>Загрузка продуктов…</span>
        </div>
      )}
      {isError && (
        <div className="products-error" role="alert">
          <p className="mb-2">
            Не удалось загрузить продукты. Попробуйте ещё раз.
          </p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "Повторная загрузка…" : "Повторить"}
          </button>
        </div>
      )}
      {isFetching && products !== undefined && (
        <p className="products-refresh" role="status">
          Обновление продуктов…
        </p>
      )}
      {products !== undefined &&
        (products.length === 0 ? (
          <PagePlaceholder
            icon={<Package size={32} strokeWidth={1.5} />}
            title={
              selectedType
                ? "Продукты этого типа не найдены"
                : "Продуктов пока нет"
            }
            description={
              selectedType
                ? "Выберите другой тип или верните «Все типы»."
                : "Здесь будут показаны товары из приходов."
            }
          />
        ) : (
          <ul
            className="products-list list-unstyled mb-0"
            aria-label="Список продуктов"
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
