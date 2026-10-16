import { Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useDeleteOrderMutation } from "@/store/api";
import type { OrderSummary } from "./types";

interface OrderDeleteDialogProps {
  order: OrderSummary;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export function OrderDeleteDialog({
  order,
  onClose,
  onDeleted,
}: OrderDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);
  const [deleteOrder, { isLoading, isError }] = useDeleteOrderMutation();

  async function handleDelete() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      await deleteOrder(order.id).unwrap();
      onDeleted(order.id);
    } catch {
      // RTK Query exposes the failure below and keeps this dialog available for retry.
    } finally {
      submittingRef.current = false;
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="order-delete-dialog"
      aria-labelledby="order-delete-title"
      aria-describedby="order-delete-description"
      aria-busy={isLoading}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onClose();
      }}
    >
      <div className="order-delete-dialog__body">
        <h2 className="order-delete-dialog__title" id="order-delete-title">
          Удалить приход?
        </h2>
        <button
          type="button"
          className="order-delete-dialog__close"
          aria-label="Закрыть подтверждение удаления"
          disabled={isLoading}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <p className="order-delete-dialog__order">{order.title}</p>
        <p
          className="order-delete-dialog__description"
          id="order-delete-description"
        >
          Приход и все связанные с ним продукты будут удалены без возможности
          восстановления.
        </p>
        {isError && (
          <p className="order-delete-dialog__error" role="alert">
            Не удалось удалить приход. Попробуйте ещё раз.
          </p>
        )}
      </div>
      <div className="order-delete-dialog__actions">
        <button
          ref={cancelRef}
          type="button"
          className="btn btn-outline-secondary"
          disabled={isLoading}
          onClick={onClose}
        >
          Отмена
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={isLoading}
          onClick={handleDelete}
        >
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
          ) : (
            <Trash2 size={16} aria-hidden="true" />
          )}
          {isLoading ? "Удаление…" : "Удалить"}
        </button>
      </div>
    </dialog>
  );
}
