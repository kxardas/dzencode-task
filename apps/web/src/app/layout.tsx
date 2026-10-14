import type { Metadata } from "next";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopMenu } from "@/components/layout/top-menu";
import { StoreProvider } from "@/store/store-provider";
import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Orders & Products",
  description: "Учёт приходов и оборудования в офисе.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main-content">
          Перейти к содержимому
        </a>
        <div className="app-shell">
          <TopMenu />
          <Sidebar />
          <main className="app-shell__content" id="main-content" tabIndex={-1}>
            <Suspense
              fallback={
                <p className="text-secondary" role="status">
                  Загрузка страницы…
                </p>
              }
            >
              <StoreProvider>{children}</StoreProvider>
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
