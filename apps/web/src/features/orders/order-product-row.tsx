import { Package } from "lucide-react";
import type { OrderProduct } from "./types";

interface OrderProductRowProps {
  product: OrderProduct;
}

export function OrderProductRow({ product }: OrderProductRowProps) {
  return (
    <li className="order-product-row">
      <span className="order-product-row__photo" aria-hidden="true">
        <Package size={28} strokeWidth={1.5} />
      </span>
      <div className="order-product-row__info">
        <p className="order-product-row__title">{product.title}</p>
        <span className="order-product-row__serial">
          {product.serialNumber}
        </span>
      </div>

      <span className="order-product-row__condition">
        {product.isNew ? "Новый" : "Б/У"}
      </span>
    </li>
  );
}
