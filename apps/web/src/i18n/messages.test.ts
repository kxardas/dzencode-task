import { describe, expect, it } from "vitest";
import { productCountKey, translate, type Locale } from "./messages";

const label = (locale: Locale, count: number) =>
  translate(locale, productCountKey(locale, count));

describe("product count label", () => {
  it("uses Russian plural forms", () => {
    expect(label("ru", 1)).toBe("Продукт");
    expect(label("ru", 2)).toBe("Продукта");
    expect(label("ru", 0)).toBe("Продуктов");
    expect(label("ru", 11)).toBe("Продуктов");
    expect(label("ru", 21)).toBe("Продукт");
    expect(label("ru", 23)).toBe("Продукта");
  });

  it("uses Ukrainian plural forms", () => {
    expect(label("uk", 1)).toBe("Продукт");
    expect(label("uk", 4)).toBe("Продукти");
    expect(label("uk", 5)).toBe("Продуктів");
    expect(label("uk", 12)).toBe("Продуктів");
    expect(label("uk", 22)).toBe("Продукти");
  });
});
