export interface OrderSummary {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  productCount: number;
  totalUSD: string;
  totalUAH: string;
}


export interface OrderProduct {
  id: number;
  orderId: number;
  title: string;
  type: string;
  serialNumber: string;
  isNew: boolean;
  photo: string | null;
  specification: string;
  warrantyStart: string;
  warrantyEnd: string;
  priceUSD: string;
  priceUAH: string;
  createdAt: string;
}

export interface OrderDetails extends OrderSummary {
  products: OrderProduct[];
}