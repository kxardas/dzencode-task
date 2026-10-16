import { describe, expect, it } from "vitest";
import {
  readProductForm,
  validateProductForm,
  type ProductFormValues,
} from "./product-form-validation";

const valid: ProductFormValues = {
  title: "Monitor",
  type: "Monitors",
  serialNumber: "MON-001",
  isNew: true,
  specification: "",
  warrantyStart: "2024-02-29",
  warrantyEnd: "2024-02-29",
  priceUSD: "0",
  priceUAH: "9999999999.99",
};

describe("Product form validation", () => {
  it("allows zero, the maximum stored price, a real leap day, and equal warranty dates", () => {
    expect(validateProductForm(valid)).toEqual({});
  });

  it.each(["-1", "1.001", "1e2", "10000000000", "NaN", ""])(
    "rejects invalid price %s",
    (priceUSD) => {
      expect(
        validateProductForm({ ...valid, priceUSD }).priceUSD,
      ).toBeDefined();
    },
  );

  it.each([
    "2026-02-29",
    "2026-02-31",
    "2026-13-01",
    "0001-01-01",
    "not-a-date",
  ])("rejects invalid date %s", (warrantyStart) => {
    expect(
      validateProductForm({ ...valid, warrantyStart }).warrantyStart,
    ).toBeDefined();
  });

  it("rejects reversed dates, blank required fields, and storage/application length violations", () => {
    expect(
      validateProductForm({ ...valid, warrantyEnd: "2023-01-01" }).warrantyEnd,
    ).toBeDefined();
    const errors = validateProductForm({
      ...valid,
      title: " ",
      type: "x".repeat(101),
      serialNumber: "",
      specification: "x".repeat(10001),
    });
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        "title",
        "type",
        "serialNumber",
        "specification",
      ]),
    );
  });

  it("trims input, normalizes comma decimals without converting money to numbers, and reads the checkbox", () => {
    const data = new FormData();
    data.set("title", " Monitor ");
    data.set("priceUSD", " 0,10 ");
    data.set("priceUAH", "4.10");
    expect(readProductForm(data)).toMatchObject({
      title: "Monitor",
      priceUSD: "0.10",
      priceUAH: "4.10",
      specification: "",
      isNew: false,
    });
    data.set("isNew", "on");
    expect(readProductForm(data).isNew).toBe(true);
  });
});
