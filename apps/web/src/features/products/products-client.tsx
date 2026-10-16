"use client";

import { useState } from "react";
import { useStore } from "react-redux";
import { usePageMetadata } from "@/i18n/page-metadata";
import type { AppStore } from "@/store/store";
import { ProductsList } from "./products-list";
import type { Product } from "./types";

const useAppStore = useStore.withTypes<AppStore>();

export function ProductsClient({
  initialProducts,
}: {
  initialProducts: Product[] | null;
}) {
  usePageMetadata("products");
  const store = useAppStore();
  useState(() => {
    store.initializeProducts(initialProducts);
    return null;
  });

  return <ProductsList />;
}
