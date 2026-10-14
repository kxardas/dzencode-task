import type { OrderSummary } from "./types";

interface OrderDetailsPanelProps {
  order: OrderSummary;
  onClose: () => void;
}

export function OrderDetailsPanel({ order, onClose }: OrderDetailsPanelProps) {
  return (
    <aside className="order-details-panel">
      <h2>{order.title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="btn btn-outline-secondary btn-sm"
      >
        Закрыть
      </button>
    </aside>
  );
}
