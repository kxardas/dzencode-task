"use client";

import { useState } from "react";
import { useStore } from "react-redux";
import { usePageMetadata } from "@/i18n/page-metadata";
import type { AppStore } from "@/store/store";
import type { OrderSummary } from "./types";
import { OrdersList } from "./orders-list";

const useAppStore = useStore.withTypes<AppStore>();

export function OrdersClient({
  initialOrders,
}: {
  initialOrders: OrderSummary[] | null;
}) {
  usePageMetadata("orders");
  const store = useAppStore();
  useState(() => {
    store.initializeOrders(initialOrders);
    return null;
  });

  return <OrdersList />;
}
