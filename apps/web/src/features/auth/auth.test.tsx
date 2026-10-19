import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryApi } from "@/store/api";
import { makeStore, type AppStore } from "@/store/store";
import { OrdersClient } from "@/features/orders/orders-client";
import type { OrderSummary } from "@/features/orders/types";
import { LocaleProvider } from "@/i18n/locale-provider";
import { LanguageSelect } from "@/i18n/language-select";
import { LoginForm } from "./login-form";
import { AuthControls } from "./auth-controls";

const order: OrderSummary = {
  id: 1,
  title: "Auth test order",
  description: "",
  createdAt: "2026-10-01T00:00:00Z",
  productCount: 0,
  totalUSD: "0.00",
  totalUAH: "0.00",
};
const user = { username: "evaluator" };
let store: AppStore;
const fetchMock = vi.fn<typeof fetch>();
function session(value = user as typeof user | null) {
  return Response.json({ data: { user: value } });
}
function seedSession(value: typeof user | null) {
  store.dispatch(
    inventoryApi.util.upsertQueryEntries([
      { endpointName: "getSession", arg: undefined, value: { user: value } },
    ]),
  );
}
function tree(children: React.ReactNode) {
  return (
    <Provider store={store}>
      <LocaleProvider>
        <LanguageSelect />
        {children}
      </LocaleProvider>
    </Provider>
  );
}
function fillLogin() {
  fireEvent.change(screen.getByLabelText("Имя пользователя"), {
    target: { value: "evaluator" },
  });
  fireEvent.change(screen.getByLabelText("Пароль"), {
    target: { value: "disposable-test-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Вход" }));
}
beforeEach(() => {
  window.localStorage.clear();
  store = makeStore();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  act(() => store.dispatch(inventoryApi.util.resetApiState()));
  window.localStorage.clear();
});

describe("Authentication UI and API cache", () => {
  it("shows a public inventory but disables mutations while signed out", async () => {
    fetchMock.mockResolvedValue(session(null));
    render(
      tree(
        <>
          <AuthControls />
          <OrdersClient initialOrders={[order]} />
        </>,
      ),
    );
    await screen.findByRole("link", { name: "Вход" });
    expect(
      screen.getByRole("article", { name: order.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Удалить приход «${order.title}»` }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: order.title }));
    expect(
      screen.getByRole("button", { name: "Добавить продукт" }),
    ).toBeDisabled();
  });

  it("validates fields, logs in with credentials and a CSRF header, and enables inventory changes", async () => {
    seedSession(null);
    fetchMock.mockImplementation(async () => session());
    const view = render(
      tree(
        <>
          <AuthControls />
          <LoginForm />
        </>,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Вход" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Введите имя пользователя и пароль",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fillLogin();
    await screen.findByText("Вы вошли как evaluator.");
    view.rerender(
      tree(
        <>
          <AuthControls />
          <OrdersClient initialOrders={[order]} />
        </>,
      ),
    );
    expect(
      screen.getByRole("button", { name: `Удалить приход «${order.title}»` }),
    ).toBeEnabled();
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.credentials).toBe("include");
    expect(request.headers.get("X-Inventory-Request")).toBe("1");
    expect(await request.json()).toEqual({
      username: "evaluator",
      password: "disposable-test-password",
    });
    expect(window.localStorage.getItem("token")).toBeNull();
    expect(JSON.stringify(store.getState())).not.toContain(
      "disposable-test-password",
    );
  });

  it.each([401, 500])(
    "shows safe translated login failure for HTTP %s and clears the password",
    async (status) => {
      seedSession(null);
      fetchMock.mockResolvedValueOnce(
        Response.json({ message: "Private details" }, { status }),
      );
      render(tree(<LoginForm />));
      fillLogin();
      await screen.findByRole("alert");
      expect(screen.getByLabelText("Пароль")).toHaveValue("");
      expect(screen.getByLabelText("Имя пользователя")).toHaveValue(
        "evaluator",
      );
      expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "uk" },
      });
      expect(screen.getByRole("alert")).toHaveTextContent(
        status === 401
          ? "Неправильне"
          : "Не вдалося",
      );
    },
  );

  it("blocks duplicate login submissions while pending", async () => {
    seedSession(null);
    fetchMock.mockImplementation(async () => session());
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(tree(<LoginForm />));
    fillLogin();
    expect(screen.getByRole("button", { name: "Вход…" })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText("Пароль").closest("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await act(async () => {
      finish(session());
    });
    await screen.findByText("Вы вошли как evaluator.");
  });

  it("keeps a session on failed logout, retries, then disables writes without removing inventory", async () => {
    seedSession(user);
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(session(null));
    render(
      tree(
        <>
          <AuthControls />
          <OrdersClient initialOrders={[order]} />
        </>,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: `Удалить приход «${order.title}»` }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Повторить выход" }));
    await screen.findByRole("link", { name: "Вход" });
    expect(
      screen.getByRole("button", { name: `Удалить приход «${order.title}»` }),
    ).toBeDisabled();
    expect(
      screen.getByRole("article", { name: order.title }),
    ).toBeInTheDocument();
  });

  it("handles session expiration on a write without retrying or removing the order", async () => {
    seedSession(user);
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(session(null));
    render(
      tree(
        <>
          <AuthControls />
          <OrdersClient initialOrders={[order]} />
        </>,
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: `Удалить приход «${order.title}»` }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Сессия завершена",
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Удалить" })).toBeDisabled(),
    );
    expect(
      screen.getByRole("article", { name: order.title }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: "Вход" })).toBeInTheDocument();
  });
});
