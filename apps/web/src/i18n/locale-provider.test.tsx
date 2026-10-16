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
import { OrdersClient } from "@/features/orders/orders-client";
import { ProductsClient } from "@/features/products/products-client";
import type { OrderSummary } from "@/features/orders/types";
import type { Product } from "@/features/products/types";
import { LanguageSelect } from "./language-select";
import {
  LocaleProvider,
  LocaleText,
  LOCALE_STORAGE_KEY,
} from "./locale-provider";

const order: OrderSummary = {
  id: 1,
  title: "Office inventory",
  description: "",
  productCount: 1,
  totalUSD: "12.34",
  totalUAH: "506.78",
  createdAt: "2026-10-01T00:00:00Z",
};
const product: Product = {
  id: 1,
  orderId: 1,
  title: "Office monitor",
  type: "Monitors",
  serialNumber: "SN-1",
  isNew: true,
  photo: null,
  specification: "",
  priceUSD: "12.34",
  priceUAH: "506.78",
  warrantyStart: "2026-10-01T00:00:00Z",
  warrantyEnd: "2028-10-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  order: { id: 1, title: order.title },
};
let stores: AppStore[];
const fetchMock = vi.fn<typeof fetch>();
function newStore() {
  const store = makeStore();
  stores.push(store);
  return store;
}
function changeLocale(value: "ru" | "uk") {
  fireEvent.change(
    screen.getByRole("combobox", { name: /Язык интерфейса|Мова інтерфейсу/ }),
    { target: { value } },
  );
}
function Preference() {
  return (
    <LocaleProvider>
      <LanguageSelect />
      <h1>
        <LocaleText id="orders" />
      </h1>
    </LocaleProvider>
  );
}
beforeEach(() => {
  stores = [];
  window.localStorage.clear();
  document.documentElement.lang = "ru";
  document.head.innerHTML = '<meta name="description" content="">';
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
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("Locale preference", () => {
  it.each([null, "invalid", "ua"])(
    "defaults to Russian for missing/invalid storage (%s)",
    (saved) => {
      if (saved) window.localStorage.setItem(LOCALE_STORAGE_KEY, saved);
      render(<Preference />);
      expect(screen.getByRole("heading")).toHaveTextContent("Приходы");
      expect(document.documentElement.lang).toBe("ru");
    },
  );

  it("persists a selection and restores it in a fresh app instance", () => {
    const first = render(<Preference />);
    changeLocale("uk");
    expect(document.documentElement.lang).toBe("uk");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("uk");
    first.unmount();
    render(<Preference />);
    expect(screen.getByRole("heading")).toHaveTextContent("Надходження");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Облік надходжень та обладнання в офісі.",
    );
  });

  it("keeps switching usable when storage cannot be read or written", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    render(<Preference />);
    expect(screen.getByRole("heading")).toHaveTextContent("Приходы");
    changeLocale("uk");
    expect(screen.getByRole("heading")).toHaveTextContent("Надходження");
    changeLocale("ru");
    expect(screen.getByRole("heading")).toHaveTextContent("Приходы");
  });

  it("syncs language changes from another tab and cleans up the subscription", () => {
    const view = render(<Preference />);
    act(() => {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, "uk");
      window.dispatchEvent(
        new StorageEvent("storage", { key: LOCALE_STORAGE_KEY }),
      );
    });
    expect(screen.getByRole("heading")).toHaveTextContent("Надходження");
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(screen.getByRole("heading")).toHaveTextContent("Приходы");
    const remove = vi.spyOn(window, "removeEventListener");
    view.unmount();
    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
  });

  it("hydrates Russian inventory HTML before restoring saved Ukrainian without mismatches or duplicate fetching", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "uk");
    const tree = (store: AppStore) => (
      <LocaleProvider>
        <Provider store={store}>
          <LanguageSelect />
          <OrdersClient initialOrders={[order]} />
        </Provider>
      </LocaleProvider>
    );
    const html = renderToString(tree(newStore()));
    expect(html).toContain("Приходы");
    expect(html).not.toContain("Надходження");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const recoverableError = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, tree(newStore()), {
          onRecoverableError: recoverableError,
        });
      });
      expect(
        screen.getByRole("heading", { name: "Надходження / 1" }),
      ).toBeInTheDocument();
      expect(document.documentElement.lang).toBe("uk");
      expect(document.title).toBe("Надходження | Orders & Products");
      document.title = "Приходы | Orders & Products";
      await waitFor(() =>
        expect(document.title).toBe("Надходження | Orders & Products"),
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(recoverableError).not.toHaveBeenCalled();
    } finally {
      if (root) act(() => root.unmount());
      container.remove();
    }
  });

  it("preserves the open order, typed form values and existing errors while translating", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...order, products: [product] } }),
    );
    render(
      <LocaleProvider>
        <Provider store={newStore()}>
          <LanguageSelect />
          <OrdersClient initialOrders={[order]} />
        </Provider>
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: order.title }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Добавить продукт" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Добавить продукт" }));
    fireEvent.change(screen.getByLabelText("Название продукта"), {
      target: { value: "Keep my draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить продукт" }));
    expect(screen.getAllByText("Заполните это поле.").length).toBeGreaterThan(
      0,
    );
    const requests = fetchMock.mock.calls.length;
    changeLocale("uk");
    expect(screen.getByLabelText("Назва продукту")).toHaveValue(
      "Keep my draft",
    );
    expect(screen.getAllByText("Заповніть це поле.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Заполните это поле.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Закрити деталі надходження" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Зберегти продукт" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: order.title }),
    ).toHaveTextContent("01 жовт. 2026");
    expect(fetchMock).toHaveBeenCalledTimes(requests);
    changeLocale("ru");
    expect(screen.getByLabelText("Название продукта")).toHaveValue(
      "Keep my draft",
    );
  });

  it("preserves the selected product type and inventory cache while switching", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: [product] }));
    render(
      <LocaleProvider>
        <Provider store={newStore()}>
          <LanguageSelect />
          <ProductsClient initialProducts={[product]} />
        </Provider>
      </LocaleProvider>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Тип продукта" }), {
      target: { value: "Monitors" },
    });
    await screen.findByRole("article", { name: product.title });
    changeLocale("uk");
    expect(screen.getByRole("combobox", { name: "Тип продукту" })).toHaveValue(
      "Monitors",
    );
    expect(
      screen.getByRole("article", { name: product.title }),
    ).toHaveTextContent("Гарантія");
    expect(
      screen.getByRole("article", { name: product.title }),
    ).toHaveTextContent(order.title);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
