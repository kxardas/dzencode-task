import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connection } from "next/server";
import ProductsPage from "./page";

vi.mock("next/server", () => ({ connection: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.mocked(connection).mockReset().mockResolvedValue(undefined);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("API_URL", undefined);
  vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Products server page", () => {
  it("waits for a request before fetching, then passes the API data to the client boundary", async () => {
    let acceptRequest!: () => void;
    vi.mocked(connection).mockReturnValueOnce(
      new Promise((resolve) => {
        acceptRequest = resolve;
      }),
    );
    const products = [{ id: 1, title: "Server product" }];
    fetchMock.mockResolvedValueOnce(Response.json({ data: products }));
    const result = ProductsPage();
    expect(fetchMock).not.toHaveBeenCalled();
    acceptRequest();
    expect((await result).props.initialProducts).toEqual(products);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/products",
      {
        cache: "no-store",
        signal: expect.any(AbortSignal),
      },
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("uses a server-only API address ahead of the public browser address", async () => {
    vi.stubEnv("API_URL", "http://api:3001/api/");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://public.example/api");
    fetchMock.mockResolvedValueOnce(Response.json({ data: [] }));
    expect((await ProductsPage()).props.initialProducts).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api:3001/api/products",
      expect.any(Object),
    );
  });

  it("falls back to the configured public API address", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://public.example/api/");
    fetchMock.mockResolvedValueOnce(Response.json({ data: [] }));
    await ProductsPage();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.example/api/products",
      expect.any(Object),
    );
  });

  it.each(["HTTP error", "network error", "invalid JSON", "invalid envelope"])(
    "allows client-side recovery after %s without exposing internal details",
    async (failure) => {
      if (failure === "network error")
        fetchMock.mockRejectedValueOnce(
          new Error("Private connection details"),
        );
      else if (failure === "HTTP error")
        fetchMock.mockResolvedValueOnce(
          new Response("Private database details", { status: 500 }),
        );
      else if (failure === "invalid JSON")
        fetchMock.mockResolvedValueOnce(new Response("Invalid JSON"));
      else
        fetchMock.mockResolvedValueOnce(
          Response.json({ message: "Private details" }),
        );
      expect((await ProductsPage()).props.initialProducts).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        "Unable to load products during server rendering; using client-side retry.",
      );
    },
  );
});
