#!/usr/bin/env bun
import { dirname, resolve } from "node:path";
import { loadRawTokens } from "./figma-parser";
import { collectSourceFiles } from "./file-scanner";
import { analyzeSourceFile } from "./ast-analyzer";
import { normalizeTokens } from "./token-normalizer";
import { formatReport } from "./reporter";
import { validateFindings } from "./validator";
import type { CliConfig } from "./types";

async function main(): Promise<void> {
  const argv = Bun.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    process.exit(0);
    return;
  }

  const config = parseArguments(argv);

  if (!config) {
    printUsage();
    process.exit(1);
    return;
  }

  try {
    const resolvedFigmaPath = resolve(config.figmaPath);
    const resolvedSrcPath = resolve(config.srcPath);

    const rawTokens = await loadRawTokens(resolvedFigmaPath);
    if (rawTokens.length === 0) {
      throw new Error(`No tokens were found in ${resolvedFigmaPath}`);
    }

    const tokenIndex = normalizeTokens(rawTokens);
    if (tokenIndex.tokens.length === 0) {
      throw new Error(`No supported tokens could be normalized from ${resolvedFigmaPath}`);
    }

    const sourceFiles = await collectSourceFiles(resolvedSrcPath);
    if (sourceFiles.length === 0) {
      throw new Error(`No supported source files were found in ${resolvedSrcPath}`);
    }

    const findings = (await Promise.all(
      sourceFiles.map(async (filePath) => {
        const sourceText = await Bun.file(filePath).text();
        return analyzeSourceFile(filePath, sourceText);
      }),
    )).flat();

    const validationResults = validateFindings(findings, tokenIndex);
    const report = formatReport(validationResults, dirname(resolvedSrcPath));
    console.log(report.text);

    process.exit(report.summary.error > 0 ? 1 : 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`design-lint: ${message}`);
    process.exit(1);
  }
}

function parseArguments(argv: string[]): CliConfig | null {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];

    if (entry.startsWith("--figma=")) {
      values.set("figma", entry.slice("--figma=".length));
      continue;
    }

    if (entry.startsWith("--src=")) {
      values.set("src", entry.slice("--src=".length));
      continue;
    }

    if (entry === "--figma" || entry === "-f") {
      const nextValue = argv[++index];
      if (nextValue) {
        values.set("figma", nextValue);
      }
      continue;
    }

    if (entry === "--src" || entry === "-s") {
      const nextValue = argv[++index];
      if (nextValue) {
        values.set("src", nextValue);
      }
      continue;
    }
  }

  const figmaPath = values.get("figma");
  const srcPath = values.get("src");

  if (!figmaPath || !srcPath) {
    return null;
  }

  return { figmaPath, srcPath };
}

function printUsage(): void {
  console.log([
    "design-lint",
    "",
    "Usage:",
    "  design-lint --figma <tokens.json|tokens-dir> --src <project-src>",
    "",
    "Options:",
    "  --figma, -f   Path to a Figma tokens JSON file or directory",
    "  --src, -s     Path to a React source folder or a single source file",
    "  --help, -h    Show this message",
  ].join("\n"));
}

await main();
