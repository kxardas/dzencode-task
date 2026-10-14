import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { OrderSummary } from "@/features/orders/types";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
    timeout: 10000,
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getOrders: builder.query<OrderSummary[], void>({
      query: () => "/orders",
      transformResponse: (response: { data: OrderSummary[] }) => response.data,
    }),
  }),
});

export const { useGetOrdersQuery } = inventoryApi;
