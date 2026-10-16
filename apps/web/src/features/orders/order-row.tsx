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
              aria-label={`Открыть приход «${order.title}»`}
              aria-pressed={isSelected}
              onClick={() => onSelect(order.id)}
            >
              <List size={22} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <div>
              <span className="order-row__count">{order.productCount}</span>
              <span className="order-row__label">Продуктов</span>
            </div>
          </div>
          <div className="order-row__date">
            <span className="visually-hidden">Дата прихода: </span>
            <time className="order-row__secondary" dateTime={order.createdAt}>
              {formatShortDate(order.createdAt)}
            </time>
            <time dateTime={order.createdAt}>
              {formatFullDate(order.createdAt)}
            </time>
          </div>
          <div className="order-row__totals">
            <span className="visually-hidden">Общая стоимость: </span>
            <span className="order-row__secondary">
              {formatPrice(order.totalUSD, "USD")}
            </span>
            <span>{formatPrice(order.totalUAH, "UAH")}</span>
          </div>
        </div>
        <button
          type="button"
          className="order-row__delete"
          aria-label={`Удалить приход «${order.title}»`}
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
