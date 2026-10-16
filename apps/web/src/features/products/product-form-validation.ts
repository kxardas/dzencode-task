import type { MessageKey } from "@/i18n/messages";
import type { CreateProductInput } from "./types";

export type ProductFormValues = Omit<CreateProductInput, "orderId" | "photo">;
export type ProductFormErrors = Partial<
  Record<
    keyof ProductFormValues,
    { key: MessageKey; values?: Record<string, number> }
  >
>;

export function readProductForm(data: FormData): ProductFormValues {
  const text = (name: keyof ProductFormValues) =>
    String(data.get(name) ?? "").trim();
  return {
    title: text("title"),
    type: text("type"),
    serialNumber: text("serialNumber"),
    warrantyStart: text("warrantyStart"),
    warrantyEnd: text("warrantyEnd"),
    priceUSD: text("priceUSD").replace(",", "."),
    priceUAH: text("priceUAH").replace(",", "."),
    specification: text("specification"),
    isNew: data.get("isNew") === "on",
  };
}

function isValidDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateProductForm(
  values: ProductFormValues,
): ProductFormErrors {
  const errors: ProductFormErrors = {};
  for (const [name, maxLength] of [
    ["title", 255],
    ["type", 100],
    ["serialNumber", 100],
  ] as const) {
    if (!values[name].trim()) errors[name] = { key: "required" };
    else if (Array.from(values[name]).length > maxLength)
      errors[name] = { key: "maxLength", values: { maxLength } };
  }
  for (const name of ["warrantyStart", "warrantyEnd"] as const) {
    if (!isValidDate(values[name])) errors[name] = { key: "invalidDate" };
  }
  if (
    !errors.warrantyStart &&
    !errors.warrantyEnd &&
    values.warrantyEnd < values.warrantyStart
  ) {
    errors.warrantyEnd = { key: "reversedWarranty" };
  }
  for (const name of ["priceUSD", "priceUAH"] as const) {
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(values[name])) {
      errors[name] = { key: "invalidPrice" };
    }
  }
  if (Array.from(values.specification).length > 10000)
    errors.specification = { key: "maxLength", values: { maxLength: 10000 } };
  return errors;
}
