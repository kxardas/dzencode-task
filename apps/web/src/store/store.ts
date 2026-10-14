import { configureStore } from "@reduxjs/toolkit";
import { inventoryApi } from "./api";

export function makeStore() {
  return configureStore({
    reducer: { [inventoryApi.reducerPath]: inventoryApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(inventoryApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
