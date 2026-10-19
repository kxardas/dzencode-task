import { useLocale } from "@/i18n/locale-provider";
import type { MessageKey } from "@/i18n/messages";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCreateProductMutation, useGetSessionQuery } from "@/store/api";
import {
  readProductForm,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "./product-form-validation";

interface ProductCreateFormProps {
  orderId: number;
  onCancel: () => void;
  onCreated: () => void;
}

interface FormField {
  name: Exclude<keyof ProductFormValues, "isNew" | "specification">;
  label: MessageKey;
  type: "text" | "date";
  maxLength?: number;
  inputMode?: "decimal";
  placeholder?: string;
}

const fields: FormField[] = [
  { name: "title", label: "productTitle", type: "text", maxLength: 255 },
  { name: "type", label: "productType", type: "text", maxLength: 100 },
  {
    name: "serialNumber",
    label: "serialNumber",
    type: "text",
    maxLength: 100,
  },
  { name: "warrantyStart", label: "warrantyStart", type: "date" },
  { name: "warrantyEnd", label: "warrantyEnd", type: "date" },
  {
    name: "priceUSD",
    label: "priceUSD",
    type: "text",
    maxLength: 13,
    inputMode: "decimal",
    placeholder: "0.00",
  },
  {
    name: "priceUAH",
    label: "priceUAH",
    type: "text",
    maxLength: 13,
    inputMode: "decimal",
    placeholder: "0.00",
  },
];

export function ProductCreateForm({
  orderId,
  onCancel,
  onCreated,
}: ProductCreateFormProps) {
  const { t } = useLocale();
  const { data: session } = useGetSessionQuery();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [createProduct, { isLoading, isError, error }] =
    useCreateProductMutation();
  const prefix = `product-create-${orderId}`;
  const status = error && "status" in error ? error.status : undefined;

  useEffect(() => {
    formRef.current?.querySelector("input")?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const values = readProductForm(new FormData(event.currentTarget));
    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      const field = event.currentTarget.elements.namedItem(firstInvalid);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    submittingRef.current = true;
    try {
      await createProduct({ orderId, ...values }).unwrap();
      onCreated();
    } catch {
      // The mutation error is shown below; preserve the entered fields for retry.
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form
      ref={formRef}
      className="product-create-form"
      aria-labelledby={`${prefix}-heading`}
      aria-busy={isLoading}
      noValidate
      onSubmit={handleSubmit}
    >
      <h3 className="product-create-form__title" id={`${prefix}-heading`}>
        {t("newProduct")}
      </h3>
      <p className="product-create-form__hint">{t("formHint")}</p>
      <fieldset className="product-create-form__fieldset" disabled={isLoading}>
        <legend className="visually-hidden">{t("productData")}</legend>
        <div className="product-create-form__grid">
          {fields.map((field) => {
            const error = errors[field.name];
            return (
              <div
                key={field.name}
                className={
                  field.name === "title"
                    ? "product-create-form__wide"
                    : undefined
                }
              >
                <label
                  className="form-label"
                  htmlFor={`${prefix}-${field.name}`}
                >
                  {t(field.label)}
                </label>
                <input
                  id={`${prefix}-${field.name}`}
                  name={field.name}
                  type={field.type}
                  className={`form-control${error ? " is-invalid" : ""}`}
                  required
                  maxLength={field.maxLength}
                  inputMode={field.inputMode}
                  placeholder={field.placeholder}
                  min={field.type === "date" ? "1000-01-01" : undefined}
                  max={field.type === "date" ? "9999-12-31" : undefined}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `${prefix}-${field.name}-error` : undefined
                  }
                />
                {error && (
                  <span
                    className="invalid-feedback d-block"
                    id={`${prefix}-${field.name}-error`}
                  >
                    {t(error.key, error.values)}
                  </span>
                )}
              </div>
            );
          })}
          <div className="product-create-form__wide">
            <label className="form-label" htmlFor={`${prefix}-specification`}>
              {t("specification")}
            </label>
            <textarea
              id={`${prefix}-specification`}
              name="specification"
              className={`form-control${errors.specification ? " is-invalid" : ""}`}
              rows={2}
              maxLength={10000}
              aria-invalid={Boolean(errors.specification)}
              aria-describedby={
                errors.specification
                  ? `${prefix}-specification-error`
                  : undefined
              }
            />
            {errors.specification && (
              <span
                className="invalid-feedback d-block"
                id={`${prefix}-specification-error`}
              >
                {t(errors.specification.key, errors.specification.values)}
              </span>
            )}
          </div>
        </div>
        <div className="form-check mt-3">
          <input
            id={`${prefix}-isNew`}
            name="isNew"
            type="checkbox"
            className="form-check-input"
            defaultChecked
          />
          <label className="form-check-label" htmlFor={`${prefix}-isNew`}>
            {t("newProduct")}
          </label>
        </div>
        {isError && (
          <p className="product-create-form__error" role="alert">
            {status === 401
              ? t("authExpired")
              : status === 404
                ? t("orderUnavailable")
                : t("saveError")}
          </p>
        )}
        <div className="product-create-form__actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-success"
            disabled={!session?.user}
          >
            {isLoading ? t("saving") : t("saveProduct")}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
