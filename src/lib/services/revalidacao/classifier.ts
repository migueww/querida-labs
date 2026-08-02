import { ProductClassification } from "@/types/revalidacao";

export interface ClassificationRule {
  name: string;
  evaluate: (codigoProduto: string, nomeProduto?: string) => ProductClassification | null;
}

// Rule 1: Product code starting with 85 is "Amostra"
export const codeStartsWith85Rule: ClassificationRule = {
  name: "Código inicia com 85 -> Amostra",
  evaluate: (codigoProduto: string) => {
    const cleanCode = String(codigoProduto).trim();
    if (cleanCode.startsWith("85")) {
      return "Amostra";
    }
    return null;
  },
};

// Extensible registry of classification rules
export const activeClassificationRules: ClassificationRule[] = [
  codeStartsWith85Rule,
];

/**
 * Classifies a product based on registered classification rules.
 * Returns "Amostra" if any rule matches, otherwise returns "Regular".
 */
export function classifyProduct(
  codigoProduto: string,
  nomeProduto?: string,
  customRules: ClassificationRule[] = activeClassificationRules
): ProductClassification {
  const cleanCode = String(codigoProduto || "").trim();
  
  for (const rule of customRules) {
    const result = rule.evaluate(cleanCode, nomeProduto);
    if (result) {
      return result;
    }
  }

  return "Regular";
}
