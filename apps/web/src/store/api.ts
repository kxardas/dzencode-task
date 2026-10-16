import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { OrderSummary, OrderDetails } from "@/features/orders/types";
import type { CreateProductInput, Product } from "@/features/products/types";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
    timeout: 10000,
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ["Order", "Product"],
  endpoints: (builder) => ({
    getOrders: builder.query<OrderSummary[], void>({
      query: () => "/orders",
      transformResponse: (response: { data: OrderSummary[] }) => response.data,
      providesTags: [{ type: "Order", id: "LIST" }],
    }),
    getOrder: builder.query<OrderDetails, number>({
      query: (id) => `/orders/${id}`,
      transformResponse: (response: { data: OrderDetails }) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    deleteOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
      async onQueryStarted(
        id,
        { dispatch, getState, queryFulfilled },
      ): Promise<void> {
        try {
          await queryFulfilled;
          dispatch(
            inventoryApi.util.updateQueryData(
              "getOrders",
              undefined,
              (orders) => orders.filter((order) => order.id !== id),
            ),
          );
          for (const type of inventoryApi.util.selectCachedArgsForQuery(
            getState(),
            "getProducts",
          )) {
            dispatch(
              inventoryApi.util.updateQueryData(
                "getProducts",
                type,
                (products) =>
                  products.filter((product) => product.orderId !== id),
              ),
            );
          }
        } catch {
          // Keep the cached list intact when deletion fails; the dialog shows the error.
        }
      },
      invalidatesTags: (_result, error, id) =>
        error
          ? []
          : [
              { type: "Order", id: "LIST" },
              { type: "Order", id },
              { type: "Product" },
            ],
    }),
    getProducts: builder.query<Product[], string | void>({
      query: (type) => ({
        url: "/products",
        params: type ? { type } : undefined,
      }),
      transformResponse: (response: { data: Product[] }) => response.data,
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation<Product, CreateProductInput>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      transformResponse: (response: { data: Product }) => response.data,
      invalidatesTags: (_result, error, input) =>
        error
          ? []
          : [
              { type: "Order", id: "LIST" },
              { type: "Order", id: input.orderId },
              { type: "Product" },
            ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useDeleteOrderMutation,
  useGetProductsQuery,
  useCreateProductMutation,
} = inventoryApi;
