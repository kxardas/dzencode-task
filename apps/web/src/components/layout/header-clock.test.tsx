import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderClock } from "./header-clock";

afterEach(() => vi.useRealTimers());

describe("Header clock", () => {
  it("renders identical initial HTML regardless of the server's current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const html = renderToString(<HeaderClock />);
    vi.setSystemTime(new Date("2027-02-02T12:00:00Z"));
    expect(renderToString(<HeaderClock />)).toBe(html);
    expect(html).toContain("Загрузка даты и времени");
  });

  it("updates local time and date across midnight and catches up after a delayed timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 23, 59, 58));
    render(<HeaderClock />);
    act(() => vi.advanceTimersByTime(1000));
    const clock = screen.getByLabelText("Текущие дата и время");
    expect(clock).toHaveTextContent("пятница");
    expect(clock).toHaveTextContent("16 окт. 2026");
    expect(clock).toHaveTextContent("23:59:59");
    act(() => vi.advanceTimersByTime(1000));
    expect(clock).toHaveTextContent("суббота");
    expect(clock).toHaveTextContent("17 окт. 2026");
    expect(clock).toHaveTextContent("00:00:00");
    vi.setSystemTime(new Date(2026, 9, 17, 10, 30, 0));
    act(() => vi.advanceTimersByTime(1000));
    expect(clock).toHaveTextContent("10:30:01");
    expect(clock).toHaveAttribute("datetime", new Date().toISOString());
  });

  it("cleans up timers when unmounted, including Strict Mode's extra effect cycle", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <StrictMode>
        <HeaderClock />
      </StrictMode>,
    );
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
