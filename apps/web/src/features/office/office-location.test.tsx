import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageSelect } from "@/i18n/language-select";
import { LocaleProvider } from "@/i18n/locale-provider";
import { OfficeLocation } from "./office-location";
import { officeLocation, officeMapUrl } from "./office.config";

function tree() {
  return (
    <LocaleProvider>
      <LanguageSelect />
      <OfficeLocation />
    </LocaleProvider>
  );
}

async function openMap() {
  fireEvent.click(screen.getByRole("button", { name: "Показать карту" }));
  return screen.findByRole("region", { name: "Карта демонстрационного офиса" });
}

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe("Office location", () => {
  it("server-renders a demo address and link without loading an interactive map", () => {
    const html = renderToString(tree());
    expect(html).toContain(officeLocation.address.ru);
    expect(html).toContain("не адрес компании");
    expect(html).toContain(officeMapUrl.replaceAll("&", "&amp;"));
    expect(html).not.toContain('class="leaflet-container');
    expect(html).not.toContain('src="https://tile.openstreetmap.org');
  });

  it("opens a real Leaflet map on demand with one marker, localized zoom controls and attribution", async () => {
    render(tree());
    expect(
      screen.queryByRole("region", { name: "Карта демонстрационного офиса" }),
    ).not.toBeInTheDocument();
    const map = await openMap();
    expect(
      screen.getByRole("button", { name: "Скрыть карту" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(within(map).getAllByTitle("Демонстрационный офис")).toHaveLength(1);
    expect(within(map).getByTitle("Увеличить масштаб")).toBeInTheDocument();
    expect(within(map).getByTitle("Уменьшить масштаб")).toBeInTheDocument();
    expect(
      within(map).getByRole("link", { name: "OpenStreetMap contributors" }),
    ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
    const tiles = map.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0].src).toMatch(/^https:\/\/tile\.openstreetmap\.org\//);
    await act(async () => {
      tiles.forEach((tile) => fireEvent.load(tile));
    });
    await waitFor(() =>
      expect(within(map).queryByRole("status")).not.toBeInTheDocument(),
    );
    fireEvent.click(within(map).getByTitle("Демонстрационный офис"));
    expect(
      within(map).getByText(officeLocation.address.ru),
    ).toBeInTheDocument();
  });

  it("unmounts the map when hidden and can open it again without losing the address", async () => {
    render(tree());
    await openMap();
    fireEvent.click(screen.getByRole("button", { name: "Скрыть карту" }));
    expect(
      screen.queryByRole("region", { name: "Карта демонстрационного офиса" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(officeLocation.address.ru)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Открыть в OpenStreetMap" }),
    ).toHaveAttribute("href", officeMapUrl);
    await openMap();
    expect(screen.getByTitle("Демонстрационный офис")).toBeInTheDocument();
  });

  it("translates the address, marker and controls while the map stays open", async () => {
    render(tree());
    await openMap();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Язык интерфейса" }),
      { target: { value: "uk" } },
    );
    expect(screen.getByText(officeLocation.address.uk)).toBeInTheDocument();
    expect(
      screen.getByText("Демонстраційна локація, не адреса компанії."),
    ).toBeInTheDocument();
    const map = screen.getByRole("region", {
      name: "Карта демонстраційного офісу",
    });
    expect(within(map).getByTitle("Демонстраційний офіс")).toBeInTheDocument();
    expect(within(map).getByTitle("Збільшити масштаб")).toBeInTheDocument();
    expect(within(map).getByTitle("Зменшити масштаб")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Приховати карту" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the address available after a tile failure and supports retry", async () => {
    render(tree());
    const map = await openMap();
    const tile = map.querySelector<HTMLImageElement>("img.leaflet-tile")!;
    fireEvent.error(tile);
    expect(await within(map).findByRole("alert")).toHaveTextContent(
      "Не удалось загрузить карту полностью",
    );
    expect(screen.getByText(officeLocation.address.ru)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Открыть в OpenStreetMap" }),
    ).toHaveAttribute("href", officeMapUrl);
    fireEvent.click(within(map).getByRole("button", { name: "Повторить" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Загрузка карты");
    expect(screen.getByTitle("Демонстрационный офис")).toBeInTheDocument();
  });
});
