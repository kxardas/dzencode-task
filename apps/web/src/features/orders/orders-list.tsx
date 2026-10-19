"use client";

import { useLocale } from "@/i18n/locale-provider";

import { ClipboardList } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { useGetOrdersQuery, useGetSessionQuery } from "@/store/api";
import Link from "next/link";
import { OrderRow } from "./order-row";
import { useState } from "react";
import { OrderDetailsPanel } from "./order-details-panel";
import { OrderDeleteDialog } from "./order-delete-dialog";

export function OrdersList() {
  const { t } = useLocale();
  const { data: session } = useGetSessionQuery();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const {
    data: orders,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetOrdersQuery(undefined, { refetchOnMountOrArgChange: 30 });

  const selectedOrder = orders?.find((order) => order.id === selectedOrderId);
  const pendingDeleteOrder = orders?.find(
    (order) => order.id === pendingDeleteId,
  );

  return (
    <section className="inventory-page" aria-labelledby="orders-title">
      <div className="inventory-page__heading">
        <h1 className="inventory-page__title" id="orders-title">
          {t("orders")}
          {orders !== undefined && ` / ${orders.length}`}
        </h1>
        <p className="inventory-page__description mb-0">
          {t("ordersDescription")}
        </p>
      </div>
      {!session?.user && (
        <p>
          <Link href="/login">{t("signInToEdit")}</Link>
        </p>
      )}
      {isLoading && (
        <div className="orders-state" role="status">
          <span
            className="spinner-border spinner-border-sm"
            aria-hidden="true"
          />
          <span>{t("loadingOrders")}</span>
        </div>
      )}

      {isError && (
        <div className="orders-error" role="alert">
          <p className="mb-2">{t("ordersError")}</p>
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? t("retrying") : t("retry")}
          </button>
        </div>
      )}
      {isFetching && !isLoading && (
        <p className="orders-refresh" role="status">
          {t("refreshingOrders")}
        </p>
      )}

      <div
        className={`orders-layout${selectedOrder ? " orders-layout--expanded" : ""}`}
      >
        {orders !== undefined && (
          <>
            {orders.length === 0 ? (
              <PagePlaceholder
                icon={<ClipboardList size={32} strokeWidth={1.5} />}
                title={t("noOrders")}
                description={t("noOrdersDescription")}
              />
            ) : (
              <ul
                className="orders-list list-unstyled mb-0"
                aria-label={t("ordersList")}
                aria-busy={isFetching}
              >
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onSelect={setSelectedOrderId}
                    onDelete={setPendingDeleteId}
                    isSelected={selectedOrderId === order.id}
                    canManage={Boolean(session?.user)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
        {selectedOrder && (
          <OrderDetailsPanel
            key={selectedOrder.id}
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
          />
        )}
      </div>
      {pendingDeleteOrder && (
        <OrderDeleteDialog
          order={pendingDeleteOrder}
          onClose={() => setPendingDeleteId(null)}
          onDeleted={(id) => {
            setPendingDeleteId(null);
            setSelectedOrderId((selectedId) =>
              selectedId === id ? null : selectedId,
            );
          }}
        />
      )}
    </section>
  );
}
