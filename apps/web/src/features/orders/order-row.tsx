import { useLocale } from "@/i18n/locale-provider";
import { ChevronRight, List, Trash2 } from "lucide-react";
import { formatFullDate, formatPrice, formatShortDate } from "@/lib/format";
import type { OrderSummary } from "./types";

interface OrderRowProps {
  order: OrderSummary;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  isSelected: boolean;
}

export function OrderRow({
  order,
  onSelect,
  onDelete,
  isSelected,
}: OrderRowProps) {
  const { locale, t } = useLocale();
  return (
    <li>
      <article
        className={`order-row${isSelected ? " order-row--selected" : ""}`}
        aria-labelledby={`order-${order.id}-title`}
      >
        <div className="order-row__content">
          <h2 className="order-row__title" id={`order-${order.id}-title`}>
            <button
              type="button"
              className="order-row__select"
              aria-pressed={isSelected}
              onClick={() => onSelect(order.id)}
            >
              {order.title}
            </button>
          </h2>
          <div className="order-row__products">
            <button
              type="button"
              className="order-row__icon"
              aria-label={t("openOrder", { title: order.title })}
              aria-pressed={isSelected}
              onClick={() => onSelect(order.id)}
            >
              <List size={22} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <div>
              <span className="order-row__count">{order.productCount}</span>
              <span className="order-row__label">{t("productCount")}</span>
            </div>
          </div>
          <div className="order-row__date">
            <span className="visually-hidden">{t("orderDate")}</span>
            <time className="order-row__secondary" dateTime={order.createdAt}>
              {formatShortDate(order.createdAt, locale)}
            </time>
            <time dateTime={order.createdAt}>
              {formatFullDate(order.createdAt, locale)}
            </time>
          </div>
          <div className="order-row__totals">
            <span className="visually-hidden">{t("total")}</span>
            <span className="order-row__secondary">
              {formatPrice(order.totalUSD, "USD", locale)}
            </span>
            <span>{formatPrice(order.totalUAH, "UAH", locale)}</span>
          </div>
        </div>
        <button
          type="button"
          className="order-row__delete"
          aria-label={t("deleteOrder", { title: order.title })}
          onClick={() => onDelete(order.id)}
        >
          <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        {isSelected && (
          <span className="order-row__indicator" aria-hidden="true">
            <ChevronRight size={24} strokeWidth={3} />
          </span>
        )}
      </article>
    </li>
  );
}
