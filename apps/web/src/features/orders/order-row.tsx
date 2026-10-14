import { List } from "lucide-react";
import { formatFullDate, formatPrice, formatShortDate } from "@/lib/format";
import type { OrderSummary } from "./types";

export function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <li>
      <article
        className="order-row"
        aria-labelledby={`order-${order.id}-title`}
      >
        <h2 className="order-row__title" id={`order-${order.id}-title`}>
          {order.title}
        </h2>
        <div className="order-row__products">
          <span className="order-row__icon" aria-hidden="true">
            <List size={22} strokeWidth={1.8} />
          </span>
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
      </article>
    </li>
  );
}
