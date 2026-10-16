import type { Metadata } from "next";
import { connection } from "next/server";
import { ProductsClient } from "@/features/products/products-client";
import type { Product } from "@/features/products/types";

export const metadata: Metadata = {
  title: "Продукты | Orders & Products",
};

export default async function ProductsPage() {
  // Keep request-time rendering outside error recovery, as on the Orders page.
  await connection();

  let initialProducts: Product[] | null = null;
  try {
    const baseUrl =
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3001/api";
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/products`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Products request failed");
    const body = (await response.json()) as { data: Product[] };
    if (!Array.isArray(body.data)) throw new Error("Invalid products response");
    initialProducts = body.data;
  } catch {
    console.error(
      "Unable to load products during server rendering; using client-side retry.",
    );
  }

  return <ProductsClient initialProducts={initialProducts} />;
}
