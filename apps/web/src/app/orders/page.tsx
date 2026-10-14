import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = {
  title: "Приходы | Orders & Products",
};

export default function OrdersPage() {
  return (
    <section className="inventory-page" aria-labelledby="orders-title">
      <div className="inventory-page__heading">
        <h1 className="inventory-page__title" id="orders-title">
          Приходы
        </h1>
        <p className="inventory-page__description mb-0">
          Поступления оборудования и продукты в каждом приходе.
        </p>
      </div>
      <PagePlaceholder
        icon={<ClipboardList size={32} strokeWidth={1.5} />}
        title="Список приходов появится здесь"
        description="Название, дата, количество продуктов и общая стоимость каждого прихода."
      />
    </section>
  );
}
