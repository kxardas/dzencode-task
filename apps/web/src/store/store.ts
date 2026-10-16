import { configureStore } from "@reduxjs/toolkit";
import { inventoryApi } from "./api";
import type { OrderSummary } from "@/features/orders/types";

export function makeStore() {
  const store = configureStore({
    reducer: { [inventoryApi.reducerPath]: inventoryApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(inventoryApi.middleware),
  });

  let ordersInitialized = false;

  function initializeOrders(orders: OrderSummary[] | null) {
    // A cached route payload must not overwrite data changed by a later mutation.
    if (ordersInitialized) return;
    ordersInitialized = true;
    const query = inventoryApi.endpoints.getOrders.select()(store.getState());
    if (orders !== null && query.isUninitialized) {
      store.dispatch(
        inventoryApi.util.upsertQueryEntries([
          { endpointName: "getOrders", arg: undefined, value: orders },
        ]),
      );
    }
  }

  return Object.assign(store, { initializeOrders });
}

export type AppStore = ReturnType<typeof makeStore>;
