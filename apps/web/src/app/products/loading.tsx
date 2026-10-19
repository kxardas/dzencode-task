import { LocaleText } from "@/i18n/locale-provider";

export default function ProductsLoading() {
  return (
    <p className="products-state" role="status">
      <LocaleText id="loadingProducts" />
    </p>
  );
}
