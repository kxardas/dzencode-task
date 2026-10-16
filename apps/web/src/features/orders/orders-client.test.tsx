import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryApi } from "@/store/api";
import { makeStore, type AppStore } from "@/store/store";
import { OrdersClient } from "./orders-client";
import type { OrderSummary } from "./types";

const orders: OrderSummary[] = [1, 2].map((id) => ({
  id,
  title: `Server order ${id}`,
  description: "",
  createdAt: "2026-10-01T00:00:00.000Z",
  productCount: 0,
  totalUSD: "0.00",
  totalUAH: "0.00",
}));

const fetchMock = vi.fn<typeof fetch>();
let stores: AppStore[];
function newStore() {
  const store = makeStore();
  stores.push(store);
  return store;
}
function tree(store: AppStore, initialOrders: OrderSummary[] | null) {
  return (
    <Provider store={store}>
      <OrdersClient initialOrders={initialOrders} />
    </Provider>
  );
}

beforeEach(() => {
  stores = [];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  act(() =>
    stores.forEach((store) =>
      store.dispatch(inventoryApi.util.resetApiState()),
    ),
  );
});

describe("Orders SSR and RTK Query", () => {
  it("renders inventory HTML on the server and hydrates without another list request", async () => {
    const html = renderToString(tree(newStore(), orders));
    expect(html).toContain(orders[0].title);
    expect(html).toContain("0,00");
    expect(html).not.toContain("Загрузка приходов");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverableError = vi.fn();
    const clientStore = newStore();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree(clientStore, orders), {
          onRecoverableError: recoverableError,
        });
      });
      expect(
        screen.getByRole("heading", { name: "Приходы / 2" }),
      ).toBeInTheDocument();
      expect(
        inventoryApi.endpoints.getOrders.select()(clientStore.getState()).data,
      ).toEqual(orders);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(recoverableError).not.toHaveBeenCalled();
    } finally {
      if (root) act(() => root.unmount());
      container.remove();
    }
  });

  it("renders an empty server collection immediately without a duplicate request", () => {
    render(tree(newStore(), []));
    expect(
      screen.getByRole("heading", { name: "Приходов пока нет" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("isolates data between server requests", () => {
    const first = renderToString(tree(newStore(), orders));
    const second = renderToString(tree(newStore(), []));
    expect(first).toContain(orders[0].title);
    expect(second).not.toContain(orders[0].title);
    expect(second).toContain("Приходов пока нет");
  });

  it("uses client-side fetching and retry when SSR could not load the list", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ data: orders }));
    render(tree(newStore(), null));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить приходы",
    );
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(
      await screen.findByRole("article", { name: orders[0].title }),
    ).toBeInTheDocument();
  });

  it("preserves successful deletion when an old route payload is reused, including after cache removal", async () => {
    fetchMock.mockImplementation(async (input) =>
      (input as Request).method === "DELETE"
        ? new Response(null, { status: 204 })
        : Response.json({ data: [orders[1]] }),
    );
    const store = newStore();
    const view = render(tree(store, orders));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", {
        name: `Удалить приход «${orders[0].title}»`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
          inventoryApi.endpoints.getOrders.select()(store.getState()).status,
        ).toBe("fulfilled"),
    );
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
    view.unmount();
    const back = render(tree(store, orders));
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Приходы / 1" }),
    ).toBeInTheDocument();
    back.unmount();
    act(() => {
      store.dispatch(inventoryApi.util.resetApiState());
    });
    render(tree(store, orders));
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("article", { name: orders[1].title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
  });

  it("keeps an existing client cache ahead of the server bootstrap payload", () => {
    const store = newStore();
    store.dispatch(
      inventoryApi.util.upsertQueryEntries([
        { endpointName: "getOrders", arg: undefined, value: [] },
      ]),
    );
    render(tree(store, orders));
    expect(
      screen.getByRole("heading", { name: "Приходов пока нет" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
