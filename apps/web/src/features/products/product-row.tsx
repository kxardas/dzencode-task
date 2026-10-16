import { useLocale } from "@/i18n/locale-provider";
import { Package } from "lucide-react";
import { formatFullDate, formatPrice, formatShortDate } from "@/lib/format";
import type { Product } from "./types";

interface ProductRowProps {
  product: Product;
}

export function ProductRow({ product }: ProductRowProps) {
  const { locale, t } = useLocale();
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
              {product.isNew ? t("new") : t("used")}
            </span>
          </div>
        </div>
        <div>
          <span className="product-row__label">{t("type")}</span>
          <span>{product.type}</span>
        </div>
        <div className="product-row__warranty">
          <span className="product-row__label">{t("warranty")}</span>
          <p>
            {t("from")}{" "}
            <time dateTime={product.warrantyStart}>
              {formatFullDate(product.warrantyStart, locale)}
            </time>
          </p>
          <p>
            {t("until")}{" "}
            <time dateTime={product.warrantyEnd}>
              {formatFullDate(product.warrantyEnd, locale)}
            </time>
          </p>
          <span className="product-row__secondary">
            {formatShortDate(product.warrantyStart, locale)} —{" "}
            {formatShortDate(product.warrantyEnd, locale)}
          </span>
        </div>
        <div>
          <span className="product-row__label">{t("price")}</span>
          <span className="product-row__secondary">
            {formatPrice(product.priceUSD, "USD", locale)}
          </span>
          <span>{formatPrice(product.priceUAH, "UAH", locale)}</span>
        </div>
        <div className="product-row__order">
          <span className="product-row__label">{t("order")}</span>
          <span>{product.order.title}</span>
        </div>
      </article>
    </li>
  );
}
