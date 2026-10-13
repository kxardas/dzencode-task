import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orders & Products",
  description: "Inventory management for orders and products.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
