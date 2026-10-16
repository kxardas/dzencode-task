import { Package } from "lucide-react";
import { formatFullDate, formatPrice, formatShortDate } from "@/lib/format";
import type { Product } from "./types";

interface ProductRowProps {
  product: Product;
}

export function ProductRow({ product }: ProductRowProps) {
  return (
    <li>
      <article
        className="product-row"
        aria-labelledby={`product-${product.id}-title`}
      >
        <div className="product-row__info">
          <span className="product-row__photo" aria-hidden="true">
            <Package size={28} strokeWidth={1.5} />
          </span>
          <div className="product-row__name">
            <h2
              className="product-row__title"
              id={`product-${product.id}-title`}
            >
              {product.title}
            </h2>
            <span className="product-row__secondary">
              {product.serialNumber}
            </span>
            <span className="product-row__secondary">
              {product.isNew ? "Новый" : "Б/у"}
            </span>
          </div>
        </div>
        <div>
          <span className="product-row__label">Тип</span>
          <span>{product.type}</span>
        </div>
        <div className="product-row__warranty">
          <span className="product-row__label">Гарантия</span>
          <p>
            с{" "}
            <time dateTime={product.warrantyStart}>
              {formatFullDate(product.warrantyStart)}
            </time>
          </p>
          <p>
            по{" "}
            <time dateTime={product.warrantyEnd}>
              {formatFullDate(product.warrantyEnd)}
            </time>
          </p>
          <span className="product-row__secondary">
            {formatShortDate(product.warrantyStart)} —{" "}
            {formatShortDate(product.warrantyEnd)}
          </span>
        </div>
        <div>
          <span className="product-row__label">Стоимость</span>
          <span className="product-row__secondary">
            {formatPrice(product.priceUSD, "USD")}
          </span>
          <span>{formatPrice(product.priceUAH, "UAH")}</span>
        </div>
        <div className="product-row__order">
          <span className="product-row__label">Приход</span>
          <span>{product.order.title}</span>
        </div>
      </article>
    </li>
  );
}
