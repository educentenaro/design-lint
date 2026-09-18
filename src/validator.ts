import type { NormalizedToken, NormalizedTokenIndex, ValidationResult } from "./types.js";
import {
  buildCssVariableName,
  buildJsReference,
  findTokensByValue,
  findTokenByPath,
  normalizeValueForCategory,
} from "./token-normalizer.js";
import type { TokenCategory } from "./types.js";

export function validateFindings(
  findings: import("./types.js").AnalysisFinding[],
  tokenIndex: NormalizedTokenIndex,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const finding of findings) {
    if (finding.kind === "reference") {
      results.push(validateReferenceFinding(finding, tokenIndex));
      continue;
    }

    results.push(validateLiteralFinding(finding, tokenIndex));
  }

  return results.sort((left, right) => {
    const fileCompare = left.finding.filePath.localeCompare(right.finding.filePath);
    if (fileCompare !== 0) {
      return fileCompare;
    }

    if (left.finding.line !== right.finding.line) {
      return left.finding.line - right.finding.line;
    }

    return left.finding.column - right.finding.column;
  });
}

function validateReferenceFinding(
  finding: import("./types.js").AnalysisFinding,
  tokenIndex: NormalizedTokenIndex,
): ValidationResult {
  const referencePath = finding.referencePath ?? [];
  const referencedSegments = referencePath[0] === "theme" || referencePath[0] === "tokens" ? referencePath.slice(1) : referencePath;
  const exactToken = referencedSegments.length > 0 ? findTokenByPath(tokenIndex, referencedSegments) : undefined;
  const referenceText = finding.referenceText ?? referencedSegments.join(".");

  if (exactToken) {
    return {
      finding,
      severity: "valid",
      message: `Uses token reference ${referenceText}`,
      suggestion: buildSuggestion(exactToken),
      matchedToken: exactToken,
    };
  }

  if (referencePath[0] === "theme" || referencePath[0] === "tokens") {
    return {
      finding,
      severity: "valid",
      message: `Uses token reference ${referenceText}`,
    };
  }

  return {
    finding,
    severity: "warning",
    message: `Reference ${referenceText} could not be resolved against the token set`,
  };
}

function validateLiteralFinding(
  finding: import("./types.js").AnalysisFinding,
  tokenIndex: NormalizedTokenIndex,
): ValidationResult {
  const category = finding.category;

  if (category === "unknown") {
    return {
      finding,
      severity: "warning",
      message: `Literal "${finding.rawValue}" requires manual review`,
    };
  }

  const normalizedValue = finding.normalizedValue || normalizeValueForCategory(category, finding.rawValue) || finding.rawValue.trim();
  const matchedTokens = findTokensByValue(tokenIndex, category, normalizedValue);
  const tokenLabel = formatCategoryLabel(category);
  const bestToken = matchedTokens[0];

  if (category === "fontSizes") {
    if (bestToken) {
      return {
        finding,
        severity: "warning",
        message: `Font size "${finding.rawValue}" should use a token instead of a hardcoded value`,
        suggestion: buildSuggestion(bestToken),
        matchedToken: bestToken,
        matchedTokens,
      };
    }

    return {
      finding,
      severity: "warning",
      message: `Font size "${finding.rawValue}" not found in typography tokens`,
    };
  }

  if (bestToken) {
    return {
      finding,
      severity: "error",
      message: `Hardcoded ${tokenLabel} "${finding.rawValue}"`,
      suggestion: buildSuggestion(bestToken),
      matchedToken: bestToken,
      matchedTokens,
    };
  }

  return {
    finding,
    severity: "error",
    message: `Hardcoded ${tokenLabel} "${finding.rawValue}"`,
  };
}

function buildSuggestion(token: NormalizedToken): string {
  return `var(--${token.cssVariableName})`;
}

function formatCategoryLabel(category: TokenCategory): string {
  switch (category) {
    case "colors":
      return "color";
    case "spacing":
      return "spacing";
    case "fontSizes":
      return "font size";
    case "radius":
      return "radius";
    case "shadows":
      return "shadow";
  }

  return category;
}
