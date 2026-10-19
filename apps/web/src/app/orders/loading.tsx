import { LocaleText } from "@/i18n/locale-provider";

export default function OrdersLoading() {
  return (
    <p className="orders-state" role="status">
      <LocaleText id="loadingOrders" />
    </p>
  );
}
