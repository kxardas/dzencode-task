import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCreateProductMutation } from "@/store/api";
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
  label: string;
  type: "text" | "date";
  maxLength?: number;
  inputMode?: "decimal";
  placeholder?: string;
}

const fields: FormField[] = [
  { name: "title", label: "Название продукта", type: "text", maxLength: 255 },
  { name: "type", label: "Тип продукта", type: "text", maxLength: 100 },
  {
    name: "serialNumber",
    label: "Серийный номер",
    type: "text",
    maxLength: 100,
  },
  { name: "warrantyStart", label: "Начало гарантии", type: "date" },
  { name: "warrantyEnd", label: "Конец гарантии", type: "date" },
  {
    name: "priceUSD",
    label: "Цена, USD",
    type: "text",
    maxLength: 13,
    inputMode: "decimal",
    placeholder: "0.00",
  },
  {
    name: "priceUAH",
    label: "Цена, UAH",
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
        Новый продукт
      </h3>
      <p className="product-create-form__hint">
        Все поля обязательны, кроме описания.
      </p>
      <fieldset className="product-create-form__fieldset" disabled={isLoading}>
        <legend className="visually-hidden">Данные продукта</legend>
        <div className="product-create-form__grid">
          {fields.map((field) => (
            <div
              key={field.name}
              className={
                field.name === "title" ? "product-create-form__wide" : undefined
              }
            >
              <label className="form-label" htmlFor={`${prefix}-${field.name}`}>
                {field.label}
              </label>
              <input
                id={`${prefix}-${field.name}`}
                name={field.name}
                type={field.type}
                className={`form-control${errors[field.name] ? " is-invalid" : ""}`}
                required
                maxLength={field.maxLength}
                inputMode={field.inputMode}
                placeholder={field.placeholder}
                min={field.type === "date" ? "1000-01-01" : undefined}
                max={field.type === "date" ? "9999-12-31" : undefined}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={
                  errors[field.name]
                    ? `${prefix}-${field.name}-error`
                    : undefined
                }
              />
              {errors[field.name] && (
                <span
                  className="invalid-feedback d-block"
                  id={`${prefix}-${field.name}-error`}
                >
                  {errors[field.name]}
                </span>
              )}
            </div>
          ))}
          <div className="product-create-form__wide">
            <label className="form-label" htmlFor={`${prefix}-specification`}>
              Описание
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
                {errors.specification}
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
            Новый продукт
          </label>
        </div>
        {isError && (
          <p className="product-create-form__error" role="alert">
            {status === 404
              ? "Приход больше недоступен. Закройте форму и обновите список приходов."
              : "Не удалось сохранить продукт. Проверьте поля и попробуйте ещё раз."}
          </p>
        )}
        <div className="product-create-form__actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button type="submit" className="btn btn-success">
            {isLoading ? "Сохранение…" : "Сохранить продукт"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
