import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryApi } from "@/store/api";
import type { AppStore } from "@/store/store";
import { makeAuthenticatedStore as makeStore } from "@/test/auth-store";
import { ProductsList } from "./products-list";
import type { Product } from "./types";

const products: Product[] = [
  {
    id: 1,
    orderId: 1,
    title: "Dell UltraSharp",
    type: "Мониторы",
    serialNumber: "MON-001",
    isNew: true,
    photo: null,
    specification: "Office monitor",
    warrantyStart: "2026-10-01T23:30:00.000Z",
    warrantyEnd: "2028-10-01T00:00:00.000Z",
    priceUSD: "499.99",
    priceUAH: "20500.50",
    createdAt: "2026-10-01T00:00:00.000Z",
    order: { id: 1, title: "Мониторы для офиса" },
  },
  {
    id: 2,
    orderId: 2,
    title: "Keychron K2",
    type: "Клавиатуры",
    serialNumber: "KEY-002",
    isNew: false,
    photo: null,
    specification: "Office keyboard",
    warrantyStart: "2026-09-15T00:00:00.000Z",
    warrantyEnd: "2027-09-15T00:00:00.000Z",
    priceUSD: "75.00",
    priceUAH: "3075.00",
    createdAt: "2026-09-15T00:00:00.000Z",
    order: { id: 2, title: "Периферия" },
  },
];

function response(data: Product[]): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ProductsList with RTK Query", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let store: AppStore;

  function renderList() {
    return render(
      <Provider store={store}>
        <ProductsList />
      </Provider>,
    );
  }

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    store = makeStore();
  });

  afterEach(() => {
    cleanup();
    act(() => {
      store.dispatch(inventoryApi.util.resetApiState());
    });
  });

  it("loads all products with their associations, decimal prices, and UTC warranty dates", async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderList();
    expect(screen.getByRole("status")).toHaveTextContent("Загрузка продуктов");
    expect(
      screen.getByRole("combobox", { name: "Тип продукта" }),
    ).toBeDisabled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await act(async () => {
      finish(response(products));
    });

    const monitor = await screen.findByRole("article", {
      name: products[0].title,
    });
    expect(monitor).toHaveTextContent("Мониторы для офиса");
    expect(monitor).toHaveTextContent("MON-001");
    expect(monitor).toHaveTextContent("Новый");
    expect(monitor).toHaveTextContent("499,99 USD");
    expect(monitor).toHaveTextContent("20 500,50 UAH");
    expect(monitor).toHaveTextContent("01 окт. 2026 г.");
    expect(monitor).toHaveTextContent("01 окт. 2028 г.");
    expect(monitor).toHaveTextContent("01.10.2026 — 01.10.2028");
    const keyboard = screen.getByRole("article", { name: products[1].title });
    expect(keyboard).toHaveTextContent("Периферия");
    expect(keyboard).toHaveTextContent("Б/у");
    expect(
      screen.getByRole("heading", { name: "Продукты / 2" }),
    ).toBeInTheDocument();
    expect((fetchMock.mock.calls[0][0] as Request).url).toMatch(
      /\/api\/products$/,
    );
  });

  it("filters through the API, keeps all type options, and resets from cache", async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockResolvedValueOnce(response(products)).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderList();
    await screen.findByRole("article", { name: products[1].title });
    const filter = screen.getByRole("combobox", { name: "Тип продукта" });
    fireEvent.change(filter, { target: { value: "Мониторы" } });
    expect(screen.getByRole("status")).toHaveTextContent("Загрузка продуктов");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      new URL((fetchMock.mock.calls[1][0] as Request).url).searchParams.get(
        "type",
      ),
    ).toBe("Мониторы");
    await act(async () => {
      finish(response([products[0]]));
    });
    expect(
      await screen.findByRole("article", { name: products[0].title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: products[1].title }),
    ).not.toBeInTheDocument();
    expect(
      within(filter).getByRole("option", { name: "Клавиатуры" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Продукты / 1" }),
    ).toBeInTheDocument();

    fireEvent.change(filter, { target: { value: "" } });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an empty inventory without fake rows", async () => {
    fetchMock.mockResolvedValueOnce(response([]));
    renderList();
    expect(
      await screen.findByRole("heading", { name: "Продуктов пока нет" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Продукты / 0" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("handles empty filter results and allows resetting the filter", async () => {
    fetchMock
      .mockResolvedValueOnce(response(products))
      .mockResolvedValueOnce(response([]));
    renderList();
    await screen.findByRole("article", { name: products[0].title });
    const filter = screen.getByRole("combobox", { name: "Тип продукта" });
    fireEvent.change(filter, { target: { value: "Мониторы" } });
    expect(
      await screen.findByRole("heading", {
        name: "Продукты этого типа не найдены",
      }),
    ).toBeInTheDocument();
    fireEvent.change(filter, { target: { value: "" } });
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("shows safe feedback for an initial failure and retries", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Private database details" }), {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(response(products));
    renderList();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить продукты",
    );
    expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(
      await screen.findByRole("article", { name: products[0].title }),
    ).toBeInTheDocument();
  });

  it("retries a failed filter request without displaying the previous collection", async () => {
    fetchMock
      .mockResolvedValueOnce(response(products))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(response([products[0]]));
    renderList();
    await screen.findByRole("article", { name: products[1].title });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Мониторы" },
    });
    await screen.findByRole("alert");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(
      await screen.findByRole("article", { name: products[0].title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: products[1].title }),
    ).not.toBeInTheDocument();
  });

  it("retains products during a failed background refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(response(products))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderList();
    await screen.findByRole("article", { name: products[0].title });
    await act(async () => {
      await store.dispatch(
        inventoryApi.endpoints.getProducts.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      );
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить продукты",
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("removes cascaded products from both caches even when refresh after order deletion fails", async () => {
    let deleted = false;
    fetchMock.mockImplementation(async (input) => {
      const request = input as Request;
      if (request.method === "DELETE") {
        deleted = true;
        return new Response(null, { status: 204 });
      }
      if (deleted) return new Response(null, { status: 500 });
      return response(
        new URL(request.url).searchParams.has("type")
          ? [products[0]]
          : products,
      );
    });
    renderList();
    await screen.findByRole("article", { name: products[0].title });
    const filter = screen.getByRole("combobox");
    fireEvent.change(filter, { target: { value: "Мониторы" } });
    await screen.findByRole("heading", { name: "Продукты / 1" });
    await act(async () => {
      await store
        .dispatch(inventoryApi.endpoints.deleteOrder.initiate(1))
        .unwrap();
    });
    await screen.findByRole("alert");
    expect(
      screen.queryByRole("article", { name: products[0].title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Продукты этого типа не найдены" }),
    ).toBeInTheDocument();
    expect(filter).toHaveValue("Мониторы");
    fireEvent.change(filter, { target: { value: "" } });
    expect(
      screen.getByRole("article", { name: products[1].title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: products[0].title }),
    ).not.toBeInTheDocument();
  });
});
