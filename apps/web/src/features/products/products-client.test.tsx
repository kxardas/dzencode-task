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
import type { AppStore } from "@/store/store";
import { makeAuthenticatedStore as makeStore } from "@/test/auth-store";
import { ProductsClient } from "./products-client";
import type { CreateProductInput, Product } from "./types";

const products: Product[] = [1, 2].map((id) => ({
  id,
  orderId: id,
  title: `Server product ${id}`,
  type: id === 1 ? "Monitors" : "Keyboards",
  serialNumber: `SN-${id}`,
  isNew: true,
  photo: null,
  specification: "",
  warrantyStart: "2026-10-01T00:00:00.000Z",
  warrantyEnd: "2028-10-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  priceUSD: "19.99",
  priceUAH: "819.59",
  order: { id, title: `Order ${id}` },
}));
const input: CreateProductInput = {
  ...products[0],
  warrantyStart: "2026-10-01",
  warrantyEnd: "2028-10-01",
};
const fetchMock = vi.fn<typeof fetch>();
let stores: AppStore[];
function newStore() {
  const store = makeStore();
  stores.push(store);
  return store;
}
function tree(store: AppStore, initialProducts: Product[] | null) {
  return (
    <Provider store={store}>
      <ProductsClient initialProducts={initialProducts} />
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

describe("Products SSR and RTK Query", () => {
  it("renders inventory, associations, prices, dates and filter options, then hydrates without another request", async () => {
    const html = renderToString(tree(newStore(), products));
    expect(html).toContain(products[0].title);
    expect(html).toContain("Order 1");
    expect(html).toContain("19,99");
    expect(html).toContain("01 окт. 2028 г.");
    expect(html).toContain('value="Keyboards"');
    expect(html).not.toContain("Загрузка продуктов");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverableError = vi.fn();
    const clientStore = newStore();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree(clientStore, products), {
          onRecoverableError: recoverableError,
        });
      });
      expect(
        screen.getByRole("heading", { name: "Продукты / 2" }),
      ).toBeInTheDocument();
      expect(
        inventoryApi.endpoints.getProducts.select()(clientStore.getState())
          .data,
      ).toEqual(products);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(recoverableError).not.toHaveBeenCalled();
    } finally {
      if (root) act(() => root.unmount());
      container.remove();
    }
  });

  it("renders an empty server collection and isolates separate requests", () => {
    expect(renderToString(tree(newStore(), products))).toContain(
      products[0].title,
    );
    const empty = renderToString(tree(newStore(), []));
    expect(empty).toContain("Продуктов пока нет");
    expect(empty).not.toContain(products[0].title);
    render(tree(newStore(), []));
    expect(
      screen.getByRole("heading", { name: "Продукты / 0" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and retries on the client after a server failure", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ data: products }));
    render(tree(newStore(), null));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(
      await screen.findByRole("article", { name: products[0].title }),
    ).toBeInTheDocument();
  });

  it("filters hydrated data through the API and resets without reloading all products", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: [products[0]] }));
    render(tree(newStore(), products));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Monitors" },
    });
    await screen.findByRole("heading", { name: "Продукты / 1" });
    expect(
      new URL((fetchMock.mock.calls[0][0] as Request).url).searchParams.get(
        "type",
      ),
    ).toBe("Monitors");
    expect(
      screen.getByRole("option", { name: "Keyboards" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps existing client data ahead of the server payload", () => {
    const store = newStore();
    store.dispatch(
      inventoryApi.util.upsertQueryEntries([
        { endpointName: "getProducts", arg: undefined, value: [] },
      ]),
    );
    render(tree(store, products));
    expect(
      screen.getByRole("heading", { name: "Продуктов пока нет" }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["before first visit", "after cache removal"])(
    "does not revive deleted products from an old route payload %s",
    async (timing) => {
      const store = newStore();
      if (timing === "after cache removal") {
        render(tree(store, products)).unmount();
        store.dispatch(inventoryApi.util.resetApiState());
      }
      fetchMock.mockImplementation(async (request) =>
        (request as Request).method === "DELETE"
          ? new Response(null, { status: 204 })
          : Response.json({ data: [products[1]] }),
      );
      await store
        .dispatch(inventoryApi.endpoints.deleteOrder.initiate(1))
        .unwrap();
      render(tree(store, products));
      expect(
        screen.queryByRole("article", { name: products[0].title }),
      ).not.toBeInTheDocument();
      await screen.findByRole("article", { name: products[1].title });
      expect(
        screen.queryByRole("article", { name: products[0].title }),
      ).not.toBeInTheDocument();
    },
  );

  it("preserves newly created products when a prefetched route is first opened and revisited", async () => {
    const store = newStore();
    const created = { ...products[0], id: 3, title: "Newly created product" };
    fetchMock.mockImplementation(async (request) =>
      (request as Request).method === "POST"
        ? Response.json({ data: created }, { status: 201 })
        : Response.json({ data: [created, ...products] }),
    );
    await store
      .dispatch(inventoryApi.endpoints.createProduct.initiate(input))
      .unwrap();
    const view = render(tree(store, products));
    await screen.findByRole("article", { name: created.title });
    view.unmount();
    render(tree(store, products));
    expect(
      screen.getByRole("article", { name: created.title }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
  });
});
