import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTokens, findTokenByPath, findTokensByValue } from "../../dist/token-normalizer.js";

test("normalizes aliased tokens and builds stable lookups", () => {
  const rawTokens = [
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

  assert.equal((index.tokens).length, 3);
  assert.equal(findTokenByPath(index, ["spacing", "md"])?.normalizedValue, "8");
  assert.equal((findTokensByValue(index, "spacing", "8")).length, 2);
  assert.equal(findTokenByPath(index, ["color", "brand", "500"])?.cssVariableName, "color-brand-500");
  assert.equal(findTokenByPath(index, ["color", "brand", "500"])?.jsReference, 'tokens.color.brand["500"]');
});