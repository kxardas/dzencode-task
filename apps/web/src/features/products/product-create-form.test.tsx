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
import { makeStore, type AppStore } from "@/store/store";
import { OrdersList } from "@/features/orders/orders-list";
import { ProductsList } from "./products-list";
import { ProductCreateForm } from "./product-create-form";
import type { Product } from "./types";

const created: Product = {
  id: 101,
  orderId: 5,
  title: "Test monitor",
  type: "Monitors",
  serialNumber: "MON-001",
  isNew: false,
  photo: null,
  specification: "Full HD",
  warrantyStart: "2026-10-01T00:00:00.000Z",
  warrantyEnd: "2028-10-01T00:00:00.000Z",
  priceUSD: "0.10",
  priceUAH: "4.10",
  createdAt: "2026-10-16T00:00:00.000Z",
  order: { id: 5, title: "Test order" },
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fillForm(form: HTMLElement) {
  const fields = within(form);
  for (const [label, value] of [
    ["Название продукта", " Test monitor "],
    ["Тип продукта", " Monitors "],
    ["Серийный номер", " MON-001 "],
    ["Начало гарантии", "2026-10-01"],
    ["Конец гарантии", "2028-10-01"],
    ["Цена, USD", " 0,10 "],
    ["Цена, UAH", "4,10"],
    ["Описание", " Full HD "],
  ])
    fireEvent.change(fields.getByLabelText(label), { target: { value } });
  fireEvent.click(fields.getByRole("checkbox", { name: "Новый продукт" }));
}

describe("Product creation form with RTK Query", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  let store: AppStore;

  function renderForm() {
    render(
      <Provider store={store}>
        <ProductCreateForm
          orderId={5}
          onCancel={onCancel}
          onCreated={onCreated}
        />
      </Provider>,
    );
    return screen.getByRole("form", { name: "Новый продукт" });
  }

  beforeEach(() => {
    fetchMock.mockReset();
    onCreated.mockReset();
    onCancel.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    store = makeStore();
  });

  afterEach(() => {
    cleanup();
    act(() => {
      store.dispatch(inventoryApi.util.resetApiState());
    });
  });

  it("rejects invalid input without submitting and focuses the first invalid field", () => {
    const form = renderForm();
    fireEvent.submit(form);
    expect(within(form).getByLabelText("Название продукта")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(within(form).getByLabelText("Название продукта")).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
    fillForm(form);
    fireEvent.change(within(form).getByLabelText("Конец гарантии"), {
      target: { value: "2025-01-01" },
    });
    fireEvent.change(within(form).getByLabelText("Цена, USD"), {
      target: { value: "-1" },
    });
    fireEvent.submit(form);
    expect(
      within(form).getByText("Конец гарантии не может быть раньше начала."),
    ).toBeInTheDocument();
    expect(within(form).getByLabelText("Цена, USD")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits normalized strings once and blocks editing/cancellation while saving", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const form = renderForm();
    fillForm(form);
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(request.url).toMatch(/\/api\/products$/);
    expect(await request.json()).toEqual({
      orderId: 5,
      title: "Test monitor",
      type: "Monitors",
      serialNumber: "MON-001",
      warrantyStart: "2026-10-01",
      warrantyEnd: "2028-10-01",
      priceUSD: "0.10",
      priceUAH: "4.10",
      specification: "Full HD",
      isNew: false,
    });
    expect(
      within(form).getByRole("button", { name: "Сохранение…" }),
    ).toBeDisabled();
    expect(within(form).getByRole("button", { name: "Отмена" })).toBeDisabled();
    expect(within(form).getByLabelText("Название продукта")).toBeDisabled();
    await act(async () => {
      finish(json(created, 201));
    });
    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
    expect(onCancel).not.toHaveBeenCalled();
  });

  it.each([400, 404, 500, "network"] as const)(
    "preserves fields after a failed save (%s) and allows retry",
    async (failure) => {
      if (failure === "network")
        fetchMock.mockRejectedValueOnce(
          new TypeError("Private network details"),
        );
      else
        fetchMock.mockResolvedValueOnce(
          new Response(
            JSON.stringify({ message: "Private database details" }),
            { status: failure },
          ),
        );
      fetchMock.mockResolvedValueOnce(json(created, 201));
      const form = renderForm();
      fillForm(form);
      fireEvent.submit(form);
      const alert = await within(form).findByRole("alert");
      expect(alert).toHaveTextContent(
        failure === 404
          ? "Приход больше недоступен"
          : "Не удалось сохранить продукт",
      );
      expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
      expect(within(form).getByLabelText("Название продукта")).toHaveValue(
        " Test monitor ",
      );
      expect(
        within(form).getByRole("button", { name: "Отмена" }),
      ).toBeEnabled();
      expect(onCreated).not.toHaveBeenCalled();
      fireEvent.submit(form);
      await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("cancels without sending a request", () => {
    const form = renderForm();
    fillForm(form);
    fireEvent.click(within(form).getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes the selected panel, summary totals, and Products after successful creation", async () => {
    let saved = false;
    fetchMock.mockImplementation(async (input) => {
      const request = input as Request;
      const path = new URL(request.url).pathname;
      if (request.method === "POST") {
        saved = true;
        return json(created, 201);
      }
      const summary = {
        id: 5,
        title: "Test order",
        description: "",
        createdAt: "2026-10-01T00:00:00.000Z",
        productCount: saved ? 1 : 0,
        totalUSD: saved ? "0.10" : "0.00",
        totalUAH: saved ? "4.10" : "0.00",
      };
      if (path === "/api/orders") return json([summary]);
      if (path === "/api/orders/5") {
        const { order, ...product } = created;
        return json({
          ...summary,
          products: saved ? [{ ...product, orderId: order.id }] : [],
        });
      }
      if (path === "/api/products") return json(saved ? [created] : []);
      throw new Error(`Unexpected request ${request.url}`);
    });
    render(
      <Provider store={store}>
        <OrdersList />
        <ProductsList />
      </Provider>,
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Открыть приход «Test order»",
      }),
    );
    const panel = screen.getByRole("complementary");
    await within(panel).findByText("В этом приходе пока нет продуктов.");
    fireEvent.click(
      within(panel).getByRole("button", { name: "Добавить продукт" }),
    );
    const form = within(panel).getByRole("form", { name: "Новый продукт" });
    fillForm(form);
    fireEvent.submit(form);
    await within(panel).findByText("Продукт добавлен.");
    await within(panel).findByText(created.title);
    expect(within(panel).queryByRole("form")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("article", { name: created.title }),
    ).toBeInTheDocument();
    const order = screen.getByRole("article", { name: "Test order" });
    expect(order).toHaveTextContent("0,10 USD");
    expect(order).toHaveTextContent("4,10 UAH");
    expect(
      screen.getByRole("heading", { name: "Продукты / 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Monitors" }),
    ).toBeInTheDocument();
  });
});
