import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/i18n/locale-provider";
import { LanguageSelect } from "@/i18n/language-select";
import { inventoryApi } from "@/store/api";
import type { AppStore } from "@/store/store";
import { makeAuthenticatedStore } from "@/test/auth-store";
import { ProductsClient } from "./products-client";
import type { CreateProductInput, Product } from "./types";

const products: Product[] = ["Monitors", "Monitors", "Keyboards"].map(
  (type, index) => ({
    id: index + 1,
    orderId: type === "Monitors" ? 1 : 2,
    title: `Product ${index + 1}`,
    type,
    serialNumber: `SN-${index + 1}`,
    isNew: true,
    photo: null,
    specification: "",
    warrantyStart: "2026-10-01T00:00:00.000Z",
    warrantyEnd: "2028-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    priceUSD: "10.00",
    priceUAH: "410.00",
    order: { id: type === "Monitors" ? 1 : 2, title: "Office inventory" },
  }),
);
const fetchMock = vi.fn<typeof fetch>();
let store: AppStore;

function renderProducts(initialProducts: Product[] | null = products) {
  return render(
    <Provider store={store}>
      <LocaleProvider>
        <LanguageSelect />
        <ProductsClient initialProducts={initialProducts} />
      </LocaleProvider>
    </Provider>,
  );
}

async function openStatistics() {
  fireEvent.click(screen.getByRole("button", { name: "Статистика инвентаря" }));
  await screen.findByText("Продукты по типам");
  return screen.getByRole("region", { name: "Статистика инвентаря" });
}

function countFor(region: HTMLElement, type: string) {
  const row = within(region).getByText(type).closest("div")!;
  return within(row).getByRole("definition");
}

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  store = makeAuthenticatedStore();
});
afterEach(() => {
  cleanup();
  act(() => store.dispatch(inventoryApi.util.resetApiState()));
  window.localStorage.clear();
});

describe("Inventory statistics", () => {
  it("opens on demand, counts all products by type, and keeps the chart independent of filtering", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ data: products.slice(0, 2) }),
    );
    renderProducts();
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Статистика инвентаря" }),
    ).toHaveAttribute("aria-expanded", "false");

    const region = await openStatistics();
    expect(region).toHaveTextContent("Всего продуктов: 3");
    expect(countFor(region, "Monitors")).toHaveTextContent(/^2$/);
    expect(countFor(region, "Keyboards")).toHaveTextContent(/^1$/);
    expect(
      within(region)
        .getAllByRole("term")
        .map((term) => term.textContent),
    ).toEqual(["Monitors", "Keyboards"]);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("combobox", { name: "Тип продукта" }), {
      target: { value: "Monitors" },
    });
    await screen.findByRole("heading", { name: "Продукты / 2" });
    expect(region).toHaveTextContent("Всего продуктов: 3");
    expect(countFor(region, "Keyboards")).toHaveTextContent(/^1$/);
    fireEvent.click(
      screen.getByRole("button", { name: "Статистика инвентаря" }),
    );
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("translates the chart without changing stored category names or counts", async () => {
    renderProducts();
    await openStatistics();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Язык интерфейса" }),
      {
        target: { value: "uk" },
      },
    );
    const region = screen.getByRole("region", { name: "Статистика інвентарю" });
    expect(region).toHaveTextContent("Продукти за типами");
    expect(region).toHaveTextContent("Усього продуктів: 3");
    expect(countFor(region, "Monitors")).toHaveTextContent(/^2$/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an empty state with no invented categories", async () => {
    renderProducts([]);
    const region = await openStatistics();
    expect(region).toHaveTextContent("Всего продуктов: 0");
    expect(region).toHaveTextContent(
      "Добавьте продукты, чтобы увидеть статистику.",
    );
    expect(within(region).queryByRole("term")).not.toBeInTheDocument();
  });

  it("handles unavailable data and recovers through the inventory retry action", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ data: products }));
    renderProducts(null);
    fireEvent.click(
      screen.getByRole("button", { name: "Статистика инвентаря" }),
    );
    const region = screen.getByRole("region", { name: "Статистика инвентаря" });
    expect(within(region).getByRole("status")).toHaveTextContent(
      "Загрузка продуктов",
    );
    expect(await within(region).findByRole("alert")).toHaveTextContent(
      "Не удалось обновить статистику",
    );
    expect(within(region).queryByRole("figure")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await within(region).findByText("Всего продуктов: 3");
    expect(countFor(region, "Monitors")).toHaveTextContent(/^2$/);
  });

  it("updates after creation and cascading deletion, retaining correct counts if refresh fails", async () => {
    let inventory = [...products];
    let deleted = false;
    const created = {
      ...products[0],
      id: 4,
      orderId: 2,
      type: "Mice",
      order: products[2].order,
    };
    fetchMock.mockImplementation(async (input) => {
      const request = input as Request;
      if (request.method === "POST") {
        inventory = [...inventory, created];
        return Response.json({ data: created }, { status: 201 });
      }
      if (request.method === "DELETE") {
        inventory = inventory.filter((product) => product.orderId !== 1);
        deleted = true;
        return new Response(null, { status: 204 });
      }
      if (deleted) return new Response(null, { status: 500 });
      return Response.json({ data: inventory });
    });
    renderProducts();
    const region = await openStatistics();
    const input: CreateProductInput = {
      orderId: 2,
      title: "Mouse",
      type: "Mice",
      serialNumber: "SN-4",
      isNew: true,
      warrantyStart: "2026-10-01",
      warrantyEnd: "2028-10-01",
      priceUSD: "10.00",
      priceUAH: "410.00",
      specification: "",
    };
    await act(async () => {
      await store
        .dispatch(inventoryApi.endpoints.createProduct.initiate(input))
        .unwrap();
    });
    await within(region).findByText("Всего продуктов: 4");
    expect(countFor(region, "Mice")).toHaveTextContent(/^1$/);
    await act(async () => {
      await store
        .dispatch(inventoryApi.endpoints.deleteOrder.initiate(1))
        .unwrap();
    });
    await within(region).findByRole("alert");
    expect(region).toHaveTextContent("Всего продуктов: 2");
    expect(within(region).queryByText("Monitors")).not.toBeInTheDocument();
    expect(countFor(region, "Keyboards")).toHaveTextContent(/^1$/);
    expect(countFor(region, "Mice")).toHaveTextContent(/^1$/);
  });
});
