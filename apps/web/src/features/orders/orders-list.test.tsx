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
import { OrdersList } from "./orders-list";
import type { OrderSummary } from "./types";

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

function response(data: OrderSummary[]): Response {
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
