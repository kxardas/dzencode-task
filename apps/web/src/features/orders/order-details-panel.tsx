import { useLocale } from "@/i18n/locale-provider";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { ProductCreateForm } from "@/features/products/product-create-form";
import { OrderProductRow } from "./order-product-row";
import type { OrderSummary } from "./types";
import { useGetOrderQuery, useGetSessionQuery } from "@/store/api";

interface OrderDetailsPanelProps {
  order: OrderSummary;
  onClose: () => void;
}

export function OrderDetailsPanel({ order, onClose }: OrderDetailsPanelProps) {
  const { t } = useLocale();
  const { data: session } = useGetSessionQuery();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [wasCreated, setWasCreated] = useState(false);
  const {
    currentData: details,
    isFetching,
    isError,
    refetch,
  } = useGetOrderQuery(order.id);

  return (
    <aside
      className="order-details-panel"
      aria-labelledby="order-details-title"
    >
      <div className="order-details-panel__header">
        <h2 className="order-details-panel__title" id="order-details-title">
          {order.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="order-details-panel__close"
          aria-label={t("closeDetails")}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {showCreateForm ? (
        <ProductCreateForm
          orderId={order.id}
          onCancel={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            setWasCreated(true);
          }}
        />
      ) : (
        <button
          type="button"
          className="order-details-panel__add btn"
          disabled={!details || !session?.user}
          title={!session?.user ? t("signInToEdit") : undefined}
          onClick={() => {
            setWasCreated(false);
            setShowCreateForm(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          {t("addProduct")}
        </button>
      )}
      {wasCreated && (
        <p className="order-details-panel__success" role="status">
          {t("productAdded")}
        </p>
      )}

      {isFetching && !details && <p role="status">{t("loadingProducts")}</p>}

      {isError && (
        <div role="alert">
          <p>{t("panelProductsError")}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? t("retrying") : t("retry")}
          </button>
        </div>
      )}

      {details &&
        (details.products.length === 0 ? (
          <p>{t("noOrderProducts")}</p>
        ) : (
          <ul className="order-details-panel__products">
            {details.products.map((product) => (
              <OrderProductRow key={product.id} product={product} />
            ))}
          </ul>
        ))}
    </aside>
  );
}
