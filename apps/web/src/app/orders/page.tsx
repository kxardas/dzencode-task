import type { Metadata } from "next";
import { OrdersList } from "@/features/orders/orders-list";

export const metadata: Metadata = {
  title: "Приходы | Orders & Products",
};

export default function OrdersPage() {
  return <OrdersList />;
}
