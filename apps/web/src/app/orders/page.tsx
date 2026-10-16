import type { Metadata } from "next";
import { connection } from "next/server";
import { OrdersClient } from "@/features/orders/orders-client";
import type { OrderSummary } from "@/features/orders/types";

export const metadata: Metadata = {
  title: "Приходы | Orders & Products",
};

export default async function OrdersPage() {
  // Inventory must be read for the current request, including when the API is down.
  // Keep this outside try/catch so Next.js can defer prerendering correctly.
  await connection();

  let initialOrders: OrderSummary[] | null = null;
  try {
    const baseUrl =
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3001/api";
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/orders`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Orders request failed");
    const body = (await response.json()) as { data: OrderSummary[] };
    if (!Array.isArray(body.data)) throw new Error("Invalid orders response");
    initialOrders = body.data;
  } catch {
    console.error(
      "Unable to load orders during server rendering; using client-side retry.",
    );
  }

  return <OrdersClient initialOrders={initialOrders} />;
}
