import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { OfficeLocation } from "./office-location";
import { officeLocation } from "./office.config";

vi.mock("./office-map", () => {
  throw new Error("Map chunk unavailable");
});

it("preserves the address and external link when the map module cannot load", async () => {
  render(<OfficeLocation />);
  fireEvent.click(screen.getByRole("button", { name: "Показать карту" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Не удалось загрузить карту полностью",
  );
  expect(screen.getByText(officeLocation.address.ru)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Открыть в OpenStreetMap" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Карта демонстрационного офиса" }),
  ).not.toBeInTheDocument();
});
