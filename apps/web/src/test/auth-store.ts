import { inventoryApi } from "@/store/api";
import { makeStore } from "@/store/store";

// Inventory behavior tests run as an authenticated evaluator. Auth lifecycle
// tests create an ordinary store and exercise actual session HTTP requests.
export function makeAuthenticatedStore() {
  const store = makeStore();
  store.dispatch(
    inventoryApi.util.upsertQueryEntries([
      {
        endpointName: "getSession",
        arg: undefined,
        value: { user: { username: "qa" } },
      },
    ]),
  );
  return store;
}
