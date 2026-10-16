import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { inventoryApi } from "./api";
import type { OrderSummary } from "@/features/orders/types";
import type { Product } from "@/features/products/types";

export function makeStore() {
  let productsInitialized = false;
  const trackProductChanges: Middleware = () => (next) => (action) => {
    // A prefetched Products payload can predate a mutation on Orders,
    // even if the Products route has never been mounted in this store.
    if (
      inventoryApi.endpoints.deleteOrder.matchFulfilled(action) ||
      inventoryApi.endpoints.createProduct.matchFulfilled(action)
    ) {
      productsInitialized = true;
    }
    return next(action);
  };
  const store = configureStore({
    reducer: { [inventoryApi.reducerPath]: inventoryApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        inventoryApi.middleware,
        trackProductChanges,
      ),
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

  function initializeProducts(products: Product[] | null) {
    if (productsInitialized) return;
    productsInitialized = true;
    const query = inventoryApi.endpoints.getProducts.select()(store.getState());
    if (products !== null && query.isUninitialized) {
      store.dispatch(
        inventoryApi.util.upsertQueryEntries([
          { endpointName: "getProducts", arg: undefined, value: products },
        ]),
      );
    }
  }

  return Object.assign(store, { initializeOrders, initializeProducts });
}

export type AppStore = ReturnType<typeof makeStore>;
