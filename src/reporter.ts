import { basename, relative } from "node:path";
import type { ReportSummary, ValidationResult } from "./types";

export interface FormattedReport {
  text: string;
  summary: ReportSummary;
}

export function formatReport(results: ValidationResult[], basePath: string): FormattedReport {
  const summary = summarizeResults(results);
  const lines: string[] = [];
  const resultsByFile = groupResultsByFile(results);
  const sortedFiles = [...resultsByFile.keys()].sort((left, right) => left.localeCompare(right));

  if (sortedFiles.length === 0) {
    lines.push("✅ No token violations found");
  }

  for (const filePath of sortedFiles) {
    const fileResults = resultsByFile.get(filePath) ?? [];
    const relativePath = formatRelativePath(basePath, filePath);
    const issueResults = fileResults.filter((result) => result.severity !== "valid");
    const validCount = fileResults.filter((result) => result.severity === "valid").length;

    if (issueResults.length === 0) {
      lines.push(`✅ ${relativePath}  All tokens correctly used`);
      continue;
    }

    for (const result of issueResults) {
      const location = `${relativePath}:${result.finding.line}:${result.finding.column}`;
      const suggestion = result.suggestion ? ` → ${result.suggestion}` : "";
      lines.push(`${renderSeveritySymbol(result.severity)} ${location}  ${result.message}${suggestion}`);
    }

    if (validCount > 0 && issueResults.length > 0) {
      lines.push(`ℹ️  ${relativePath}  ${validCount} token-backed usages accepted`);
    }
  }

  lines.push("");
  lines.push(`Summary: ${summary.error} error${summary.error === 1 ? "" : "s"}, ${summary.warning} warning${summary.warning === 1 ? "" : "s"}, ${summary.valid} valid`);
  lines.push(summary.error > 0 ? "Result: failed" : "Result: passed");

  return {
    text: lines.join("\n"),
    summary,
  };
}

function groupResultsByFile(results: ValidationResult[]): Map<string, ValidationResult[]> {
  const groups = new Map<string, ValidationResult[]>();

  for (const result of results) {
    const bucket = groups.get(result.finding.filePath) ?? [];
    bucket.push(result);
    groups.set(result.finding.filePath, bucket);
  }

  return groups;
}

function summarizeResults(results: ValidationResult[]): ReportSummary {
  return results.reduce<ReportSummary>(
    (summary, result) => {
      summary[result.severity] += 1;
      return summary;
    },
    { valid: 0, warning: 0, error: 0 },
  );
}

function formatRelativePath(basePath: string, filePath: string): string {
  const path = relative(basePath, filePath);
  return path.length > 0 ? path : basename(filePath);
}

function renderSeveritySymbol(severity: ValidationResult["severity"]): string {
  switch (severity) {
    case "valid":
      return "✅";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
  }
}
