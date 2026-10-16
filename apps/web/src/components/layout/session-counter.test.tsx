import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { LanguageSelect } from "@/i18n/language-select";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionCounter } from "./session-counter";

const { io } = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock("socket.io-client", () => ({ io }));

class FakeSocket {
  listeners = new Map<string, Set<(value: unknown) => void>>();
  connect = vi.fn();
  disconnect = vi.fn();

  on(event: string, listener: (value: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (value: unknown) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  receive(event: string, value?: unknown) {
    act(() =>
      this.listeners.get(event)?.forEach((listener) => listener(value)),
    );
  }
}

let socket: FakeSocket;
beforeEach(() => {
  socket = new FakeSocket();
  io.mockReset().mockReturnValue(socket);
});

describe("Session counter", () => {
  it("translates counts and disconnected states without recreating the socket", () => {
    window.localStorage.clear();
    render(
      <LocaleProvider>
        <LanguageSelect />
        <SessionCounter />
      </LocaleProvider>,
    );
    socket.receive("sessions:count", { count: 2 });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "uk" } });
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Активні вкладки: 2",
    );
    socket.receive("disconnect");
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Лічильник недоступний. Повторне підключення…",
    );
    expect(io).toHaveBeenCalledOnce();
    expect(socket.disconnect).not.toHaveBeenCalled();
    window.localStorage.clear();
  });
  it("waits for the server's count instead of showing a fabricated zero", () => {
    render(<SessionCounter />);
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Подключение счётчика…",
    );
    expect(socket.connect).toHaveBeenCalledOnce();
    socket.receive("sessions:count", { count: 3 });
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Активные вкладки: 3",
    );
    socket.receive("sessions:count", { count: 2 });
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Активные вкладки: 2",
    );
  });

  it.each(["disconnect", "connect_error"])(
    "hides stale counts after %s and accepts a fresh count after reconnecting",
    (event) => {
      render(<SessionCounter />);
      socket.receive("sessions:count", { count: 5 });
      socket.receive(event);
      expect(screen.getByRole("status")).toHaveAccessibleName(
        "Счётчик недоступен. Повторное подключение…",
      );
      expect(screen.getByRole("status")).not.toHaveTextContent("5");
      socket.receive("sessions:count", { count: 1 });
      expect(screen.getByRole("status")).toHaveAccessibleName(
        "Активные вкладки: 1",
      );
    },
  );

  it("does not display invalid counts", () => {
    render(<SessionCounter />);
    socket.receive("sessions:count", { count: 2 });
    for (const count of [-1, 1.5, NaN])
      socket.receive("sessions:count", { count });
    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Активные вкладки: 2",
    );
  });

  it("disconnects and removes listeners on cleanup without duplicates in Strict Mode", () => {
    const first = new FakeSocket();
    io.mockReturnValueOnce(first).mockReturnValueOnce(socket);
    const { unmount } = render(
      <StrictMode>
        <SessionCounter />
      </StrictMode>,
    );
    expect(first.disconnect).toHaveBeenCalledOnce();
    expect(
      [...first.listeners.values()].every((listeners) => listeners.size === 0),
    ).toBe(true);
    expect(socket.listeners.get("sessions:count")?.size).toBe(1);
    unmount();
    expect(socket.disconnect).toHaveBeenCalledOnce();
    expect(
      [...socket.listeners.values()].every((listeners) => listeners.size === 0),
    ).toBe(true);
  });
});
