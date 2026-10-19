"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { translate, type Locale, type MessageKey } from "./messages";

export const LOCALE_STORAGE_KEY = "inventory.locale";
function isLocale(value: string | null): value is Locale {
  return value === "ru" || value === "uk";
}

function createLocaleStore() {
  let current: Locale | null = null;
  const listeners = new Set<() => void>();
  function onStorage(event: StorageEvent) {
    if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return;
    current = null;
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot(): Locale {
      if (current) return current;
      try {
        const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        current = isLocale(saved) ? saved : "ru";
      } catch {
        current = "ru";
      }
      return current;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0)
          window.removeEventListener("storage", onStorage);
      };
    },
    setLocale(locale: Locale) {
      current = locale;
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // The preference remains usable for this session if storage is blocked.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

const LocaleContext = createContext<ReturnType<typeof createLocaleStore>>({
  getSnapshot: () => "ru",
  subscribe: () => () => {},
  setLocale: () => {},
});
const getServerSnapshot = (): Locale => "ru";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createLocaleStore);
  const locale = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", translate(locale, "description"));
  }, [locale]);
  return (
    <LocaleContext.Provider value={store}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const store = useContext(LocaleContext);
  // Each streamed Suspense subtree must hydrate with its own Russian snapshot,
  // even when an earlier subtree has already restored the saved preference.
  const locale = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return {
    locale,
    setLocale: store.setLocale,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}

export function LocaleText({ id }: { id: MessageKey }) {
  return useLocale().t(id);
}
