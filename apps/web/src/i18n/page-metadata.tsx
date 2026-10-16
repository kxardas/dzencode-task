"use client";

import { useEffect } from "react";
import { useLocale } from "./locale-provider";
import { translate } from "./messages";

export function usePageMetadata(page: "orders" | "products") {
  const { locale } = useLocale();
  useEffect(() => {
    const title = `${translate(locale, page)} | Orders & Products`;
    const updateTitle = () => {
      if (document.title !== title) document.title = title;
    };
    updateTitle();
    // Next.js can stream its default-language metadata after hydration.
    const observer = new MutationObserver(updateTitle);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [locale, page]);
}
