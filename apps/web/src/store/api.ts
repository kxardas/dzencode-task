import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { OrderSummary, OrderDetails } from "@/features/orders/types";
import type { CreateProductInput, Product } from "@/features/products/types";

export interface AuthSession {
  user: { username: string } | null;
}
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  timeout: 10000,
  credentials: "include",
  prepareHeaders(headers, { arg }) {
    if (typeof arg !== "string" && arg.method && arg.method !== "GET") {
      headers.set("X-Inventory-Request", "1");
    }
    return headers;
  },
});

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ["Order", "Product", "Session"],
  endpoints: (builder) => ({
    getSession: builder.query<AuthSession, void>({
      query: () => "/auth/session",
      transformResponse: (response: { data: AuthSession }) => response.data,
      providesTags: ["Session"],
    }),
    login: builder.mutation<
      AuthSession,
      { username: string; password: string }
    >({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: { data: AuthSession }) => response.data,
      invalidatesTags: (_result, error) => (error ? [] : ["Session"]),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Session"]),
    }),
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
      invalidatesTags: (_result, error, id) => {
        if (error?.status === 401) return ["Session"];
        if (error) return [];
        return [
          { type: "Order", id: "LIST" },
          { type: "Order", id },
          { type: "Product" },
        ];
      },
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
      invalidatesTags: (_result, error, input) => {
        if (error?.status === 401) return ["Session"];
        if (error) return [];
        return [
          { type: "Order", id: "LIST" },
          { type: "Order", id: input.orderId },
          { type: "Product" },
        ];
      },
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLoginMutation,
  useLogoutMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useDeleteOrderMutation,
  useGetProductsQuery,
  useCreateProductMutation,
} = inventoryApi;
