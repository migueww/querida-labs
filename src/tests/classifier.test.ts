import { describe, it, expect } from "vitest";
import {
  classifyProduct,
  codeStartsWith85Rule,
  ClassificationRule,
} from "../lib/services/revalidacao/classifier";

describe("Classification Engine", () => {
  it("should classify product code starting with 85 as 'Amostra'", () => {
    expect(classifyProduct("8515518")).toBe("Amostra");
    expect(classifyProduct("8500000")).toBe("Amostra");
    expect(classifyProduct(" 859999 ")).toBe("Amostra");
  });

  it("should classify product code not starting with 85 as 'Regular'", () => {
    expect(classifyProduct("4009385")).toBe("Regular");
    expect(classifyProduct("1000622")).toBe("Regular");
    expect(classifyProduct("9500123")).toBe("Regular");
  });

  it("should support adding custom classification rules", () => {
    const customRule: ClassificationRule = {
      name: "Custom Rule for code ending in TEST",
      evaluate: (code) => (code.endsWith("TEST") ? "Amostra" : null),
    };

    const rules = [codeStartsWith85Rule, customRule];

    expect(classifyProduct("12345TEST", "Nome", rules)).toBe("Amostra");
    expect(classifyProduct("85123", "Nome", rules)).toBe("Amostra");
    expect(classifyProduct("12345", "Nome", rules)).toBe("Regular");
  });
});
