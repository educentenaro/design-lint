import { expect, test } from "bun:test";
import { normalizeTokens, findTokenByPath, findTokensByValue } from "../../src/token-normalizer";
import type { RawToken } from "../../src/types";

test("normalizes aliased tokens and builds stable lookups", () => {
  const rawTokens: RawToken[] = [
    {
      sourceFile: "Default.tokens.json",
      pathSegments: ["spacing", "base"],
      tokenName: "spacing.base",
      type: "dimension",
      rawValue: "8px",
    },
    {
      sourceFile: "Default.tokens.json",
      pathSegments: ["spacing", "md"],
      tokenName: "spacing.md",
      type: "dimension",
      rawValue: "{spacing.base}",
    },
    {
      sourceFile: "Default.tokens.json",
      pathSegments: ["color", "brand", "500"],
      tokenName: "color.brand.500",
      type: "color",
      rawValue: "#13544A",
    },
  ];

  const index = normalizeTokens(rawTokens);

  expect(index.tokens).toHaveLength(3);
  expect(findTokenByPath(index, ["spacing", "md"])?.normalizedValue).toBe("8");
  expect(findTokensByValue(index, "spacing", "8")).toHaveLength(2);
  expect(findTokenByPath(index, ["color", "brand", "500"])?.cssVariableName).toBe("color-brand-500");
  expect(findTokenByPath(index, ["color", "brand", "500"])?.jsReference).toBe('tokens.color.brand["500"]');
});