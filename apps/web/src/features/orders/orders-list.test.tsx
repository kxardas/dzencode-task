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
import { OrdersList } from "./orders-list";
import type { OrderDetails, OrderSummary } from "./types";

const orders: OrderSummary[] = [
  {
    id: 1,
    title: "Мониторы для офиса",
    description: "Два монитора",
    createdAt: "2026-10-01T23:30:00.000Z",
    productCount: 2,
    totalUSD: "649.94",
    totalUAH: "26650.75",
  },
  {
    id: 2,
    title: "Ожидаемый приход",
    description: "",
    createdAt: "2026-10-10T08:15:00.000Z",
    productCount: 0,
    totalUSD: "0.00",
    totalUAH: "0.00",
  },
];

const products = ["Первый монитор", "Второй монитор"].map((title, index) => ({
  id: 1001 + index,
  orderId: orders[0].id,
  title,
  type: "Monitors",
  serialNumber: `MON-${index + 1}`,
  isNew: true,
  photo: null,
  specification: "",
  warrantyStart: "2026-10-01T00:00:00.000Z",
  warrantyEnd: "2028-10-01T00:00:00.000Z",
  priceUSD: index === 0 ? "499.99" : "149.95",
  priceUAH: index === 0 ? "20500.50" : "6150.25",
  createdAt: orders[0].createdAt,
}));

function response(data: OrderSummary[] | OrderDetails): Response {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OrdersList with RTK Query", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let store: AppStore;

  function renderList() {
    return render(
      <Provider store={store}>
        <OrdersList />
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

  it("shows loading until the request finishes and then renders the server values", async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderList();
    expect(screen.getByRole("status")).toHaveTextContent("Загрузка приходов");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect((fetchMock.mock.calls[0][0] as Request).url).toMatch(
      /\/api\/orders$/,
    );
    await act(async () => {
      finish(response(orders));
    });

    expect(
      await screen.findByRole("heading", { name: "Приходы / 2" }),
    ).toBeInTheDocument();
    const first = screen.getByRole("article", { name: orders[0].title });
    expect(within(first).getByText("2")).toBeInTheDocument();
    expect(first).toHaveTextContent("01.10");
    expect(first).toHaveTextContent("01 окт. 2026 г.");
    expect(first).toHaveTextContent("649,94 USD");
    expect(first).toHaveTextContent("26 650,75 UAH");
    const empty = screen.getByRole("article", { name: orders[1].title });
    expect(within(empty).getByText("0")).toBeInTheDocument();
    expect(empty).toHaveTextContent("0,00 USD");
    expect(empty).toHaveTextContent("0,00 UAH");
    expect(screen.queryByText("Загрузка приходов…")).not.toBeInTheDocument();
  });

  it("shows a genuine empty state for an empty server collection", async () => {
    fetchMock.mockResolvedValueOnce(response([]));
    renderList();
    expect(
      await screen.findByRole("heading", { name: "Приходов пока нет" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Приходы / 0" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("selects and switches orders through the icons, loads their products, and clears selection on close", async () => {
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockResolvedValueOnce(response({ ...orders[0], products }))
      .mockResolvedValueOnce(response({ ...orders[1], products: [] }));
    renderList();
    const first = await screen.findByRole("button", {
      name: `Открыть приход «${orders[0].title}»`,
    });
    const second = screen.getByRole("button", {
      name: `Открыть приход «${orders[1].title}»`,
    });
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(
      within(screen.getByRole("complementary")).getByRole("heading", {
        name: orders[0].title,
      }),
    ).toBeInTheDocument();
    expect(
      await within(screen.getByRole("complementary")).findByText(
        products[0].title,
      ),
    ).toBeInTheDocument();

    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(
      within(screen.getByRole("complementary")).getByRole("heading", {
        name: orders[1].title,
      }),
    ).toBeInTheDocument();
    expect(
      await within(screen.getByRole("complementary")).findByText(
        "В этом приходе пока нет продуктов.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(products[0].title)).not.toBeInTheDocument();

    const panel = screen.getByRole("complementary");
    fireEvent.click(
      screen.getByRole("button", { name: "Закрыть детали прихода" }),
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(panel).not.toBeInTheDocument();

    fireEvent.click(first);
    expect(screen.getByRole("complementary")).toHaveTextContent(
      products[0].title,
    );
    expect(first).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the deletion dialog and cancels through each dismissal action without sending requests", async () => {
    fetchMock.mockResolvedValueOnce(response(orders));
    renderList();
    const trigger = await screen.findByRole("button", {
      name: `Удалить приход «${orders[0].title}»`,
    });

    for (const action of ["cancel", "close", "escape"]) {
      fireEvent.click(trigger);
      const dialog = screen.getByRole("dialog", { name: "Удалить приход?" });
      expect(dialog).toHaveTextContent(orders[0].title);
      expect(dialog).toHaveTextContent("все связанные с ним продукты");
      expect(
        within(dialog).getByRole("button", { name: "Удалить" }),
      ).toBeEnabled();
      expect(
        within(dialog).getByRole("button", { name: "Отмена" }),
      ).toHaveFocus();
      expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

      if (action === "escape") {
        fireEvent(dialog, new Event("cancel", { cancelable: true }));
      } else {
        fireEvent.click(
          within(dialog).getByRole("button", {
            name:
              action === "cancel" ? "Отмена" : "Закрыть подтверждение удаления",
          }),
        );
      }

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByRole("article", { name: orders[0].title }),
      ).toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe("hidden");
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("preserves the selected order when cancelling deletion of another order", async () => {
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockResolvedValueOnce(response({ ...orders[1], products: [] }));
    renderList();
    fireEvent.click(
      await screen.findByRole("button", {
        name: `Открыть приход «${orders[1].title}»`,
      }),
    );
    await screen.findByText("В этом приходе пока нет продуктов.");
    fireEvent.click(
      screen.getByRole("button", {
        name: `Удалить приход «${orders[0].title}»`,
      }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(orders[0].title);
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(screen.getByRole("complementary")).toHaveAccessibleName(
      orders[1].title,
    );
    expect(
      screen.getByRole("button", {
        name: `Открыть приход «${orders[1].title}»`,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("waits for confirmed deletion, blocks duplicate requests and dismissal, and closes the selected panel", async () => {
    let finish!: (value: Response) => void;
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockResolvedValueOnce(response({ ...orders[0], products }))
      .mockImplementation(async (input) => {
        const request = input as Request;
        if (request.method === "DELETE") {
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        }
        if (request.url.endsWith("/orders")) return response([orders[1]]);
        return new Response(null, { status: 404 });
      });
    renderList();
    fireEvent.click(
      await screen.findByRole("button", {
        name: `Открыть приход «${orders[0].title}»`,
      }),
    );
    await within(screen.getByRole("complementary")).findByText(
      products[0].title,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `Удалить приход «${orders[0].title}»`,
      }),
    );
    const confirm = screen.getByRole("button", { name: "Удалить" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(
          ([input]) => (input as Request).method === "DELETE",
        ),
      ).toHaveLength(1),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Удаление…" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Отмена" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", {
        name: "Закрыть подтверждение удаления",
      }),
    ).toBeDisabled();
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: orders[0].title }),
    ).toBeInTheDocument();

    await act(async () => {
      finish(new Response(null, { status: 204 }));
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Приходы / 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: orders[1].title }),
    ).toBeInTheDocument();
    const requests = fetchMock.mock.calls.map(([input]) => input as Request);
    expect(
      requests.find((request) => request.method === "DELETE")?.url,
    ).toMatch(/\/api\/orders\/1$/);
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          (input as Request).url.endsWith("/orders"),
        ),
      ).toHaveLength(2),
    );
  });

  it("deletes an empty order while preserving another order's selected panel", async () => {
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockResolvedValueOnce(response({ ...orders[0], products }))
      .mockImplementation(async (input) =>
        (input as Request).method === "DELETE"
          ? new Response(null, { status: 204 })
          : response([orders[0]]),
      );
    renderList();
    fireEvent.click(
      await screen.findByRole("button", {
        name: `Открыть приход «${orders[0].title}»`,
      }),
    );
    await within(screen.getByRole("complementary")).findByText(
      products[0].title,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: `Удалить приход «${orders[1].title}»`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("complementary")).toHaveAccessibleName(
      orders[0].title,
    );
    expect(screen.getByRole("complementary")).toHaveTextContent(
      products[0].title,
    );
    expect(
      screen.queryByRole("article", { name: orders[1].title }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state after deleting the last order", async () => {
    fetchMock
      .mockResolvedValueOnce(response([orders[1]]))
      .mockImplementation(async (input) =>
        (input as Request).method === "DELETE"
          ? new Response(null, { status: 204 })
          : response([]),
      );
    renderList();
    fireEvent.click(
      await screen.findByRole("button", {
        name: `Удалить приход «${orders[1].title}»`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(
      await screen.findByRole("heading", { name: "Приходов пока нет" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Приходы / 0" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([404, 500, "network"] as const)(
    "keeps failed deletion (%s) open with safe feedback and allows retry",
    async (failure) => {
      let attempts = 0;
      fetchMock
        .mockResolvedValueOnce(response(orders))
        .mockImplementation(async (input) => {
          if ((input as Request).method !== "DELETE")
            return response([orders[1]]);
          attempts += 1;
          if (attempts > 1) return new Response(null, { status: 204 });
          if (failure === "network")
            throw new TypeError("Private network details");
          return new Response(
            JSON.stringify({ message: "Private database details" }),
            { status: failure },
          );
        });
      renderList();
      fireEvent.click(
        await screen.findByRole("button", {
          name: `Удалить приход «${orders[0].title}»`,
        }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Не удалось удалить приход",
      );
      expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("article", { name: orders[0].title }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Приходы / 2" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Отмена" })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("article", { name: orders[0].title }),
      ).not.toBeInTheDocument();
      expect(attempts).toBe(2);
    },
  );

  it("keeps a successfully deleted order removed even if the list refresh fails", async () => {
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockImplementation(async (input) =>
        (input as Request).method === "DELETE"
          ? new Response(null, { status: 204 })
          : new Response(null, { status: 500 }),
      );
    renderList();
    fireEvent.click(
      await screen.findByRole("button", {
        name: `Удалить приход «${orders[0].title}»`,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить приходы",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: orders[0].title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: orders[1].title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Приходы / 1" }),
    ).toBeInTheDocument();
  });

  it("shows a safe error and retries successfully without reloading the page", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Private database details" }), {
          status: 500,
        }),
      )
      .mockResolvedValueOnce(response(orders));
    renderList();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить приходы",
    );
    expect(screen.queryByText(/Private database/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(
      await screen.findByRole("article", { name: orders[0].title }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses cached data after remounting within the freshness interval", async () => {
    fetchMock.mockResolvedValueOnce(response(orders));
    const view = renderList();
    await screen.findByRole("article", { name: orders[0].title });
    view.unmount();
    renderList();
    expect(
      screen.getByRole("article", { name: orders[0].title }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps previously loaded data visible if a background refresh fails", async () => {
    fetchMock
      .mockResolvedValueOnce(response(orders))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderList();
    await screen.findByRole("article", { name: orders[0].title });
    await act(async () => {
      await store.dispatch(
        inventoryApi.endpoints.getOrders.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      );
    });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: orders[0].title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Приходов пока нет" }),
    ).not.toBeInTheDocument();
  });
});
