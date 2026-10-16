import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Node 26 exposes its own localStorage global. Use jsdom's origin-scoped
// browser storage rather than Node's optional file-backed implementation.
const browserStorage = (
  globalThis as typeof globalThis & {
    jsdom: { window: { localStorage: Storage } };
  }
).jsdom.window.localStorage;
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: browserStorage,
});

// jsdom does not implement the native dialog methods.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
