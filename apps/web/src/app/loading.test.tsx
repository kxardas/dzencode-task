import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/locale-provider";
import { LanguageSelect } from "@/i18n/language-select";
import OrdersLoading from "./orders/loading";
import ProductsLoading from "./products/loading";

describe("Route loading placeholders", () => {
  it("keeps inventory loading visible and localized during navigation", () => {
    window.localStorage.clear();
    render(
      <LocaleProvider>
        <LanguageSelect />
        <OrdersLoading />
        <ProductsLoading />
      </LocaleProvider>,
    );
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "Загрузка приходов",
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "uk" } });
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "Завантаження надходжень",
    );
    expect(screen.getAllByRole("status")[1]).toHaveTextContent(
      "Завантаження продуктів",
    );
    window.localStorage.clear();
  });
});
