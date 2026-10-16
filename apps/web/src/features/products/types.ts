import type { OrderProduct } from "@/features/orders/types";

export interface Product extends OrderProduct {
  order: {
    id: number;
    title: string;
  };
}

export interface CreateProductInput {
  orderId: number;
  title: string;
  type: string;
  serialNumber: string;
  isNew: boolean;
  warrantyStart: string;
  warrantyEnd: string;
  priceUSD: string;
  priceUAH: string;
  specification: string;
  photo?: string | null;
}
