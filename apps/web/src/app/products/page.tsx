import type { Metadata } from "next";
import { Package } from "lucide-react";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = {
  title: "Продукты | Orders & Products",
};

export default function ProductsPage() {
  return (
    <section className="inventory-page" aria-labelledby="products-title">
      <div className="inventory-page__heading">
        <h1 className="inventory-page__title" id="products-title">
          Продукты
        </h1>
        <p className="inventory-page__description mb-0">
          Оборудование из всех приходов в одном месте.
        </p>
      </div>
      <PagePlaceholder
        icon={<Package size={32} strokeWidth={1.5} />}
        title="Список продуктов появится здесь"
        description="Типы оборудования, цены, гарантия и связанные приходы."
      />
    </section>
  );
}
