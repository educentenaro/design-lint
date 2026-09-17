import { afterEach, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadRawTokens } from "../../src/figma-parser";
import { collectSourceFiles } from "../../src/file-scanner";
import { analyzeSourceFile } from "../../src/ast-analyzer";
import { normalizeTokens } from "../../src/token-normalizer";
import { formatReport } from "../../src/reporter";
import { validateFindings } from "../../src/validator";

let tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((directory) => rm(directory, { recursive: true, force: true })));
  tempDirs = [];
});

test("loads tokens, scans sources, and produces a mixed report", async () => {
  const root = await mkdtemp(join(tmpdir(), "design-lint-pipeline-"));
  tempDirs.push(root);

  const tokensDir = join(root, "tokens");
  const srcDir = join(root, "src");

  await mkdir(tokensDir, { recursive: true });
  await mkdir(srcDir, { recursive: true });

  await writeFile(
    join(tokensDir, "Default.tokens.json"),
    JSON.stringify(
      {
        spacing: {
          md: {
            $type: "dimension",
            $value: "12px",
          },
        },
        radius: {
          rounded: {
            md: {
              $type: "dimension",
              $value: "6px",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  await writeFile(
    join(tokensDir, "Dark.tokens.json"),
    JSON.stringify(
      {
        $extensions: {
          "com.figma.modeName": "Dark",
        },
        color: {
          background: {
            100: {
              $type: "color",
              $value: "#111111",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  await writeFile(
    join(srcDir, "Button.tsx"),
    [
      'export function Button() {',
      '  return <button style={{ color: "#111111", padding: "12px" }} />;',
      '}',
      '',
      'export const themed = {',
      '  color: theme.colors.background[100],',
      '};',
      '',
    ].join("\n"),
  );

  const rawTokens = await loadRawTokens(tokensDir);
  const tokenIndex = normalizeTokens(rawTokens);
  const sourceFiles = await collectSourceFiles(srcDir);
  const findings = (await Promise.all(sourceFiles.map(async (filePath) => analyzeSourceFile(filePath, await Bun.file(filePath).text())))).flat();
  const validationResults = validateFindings(findings, tokenIndex);
  const report = formatReport(validationResults, srcDir);

  expect(rawTokens).toHaveLength(3);
  expect(sourceFiles).toHaveLength(1);
  expect(report.summary.error).toBe(2);
  expect(report.summary.warning).toBe(0);
  expect(report.summary.valid).toBe(1);
  expect(report.text).toContain('Hardcoded color "#111111"');
  expect(report.text).toContain('Hardcoded spacing "12px"');
  expect(report.text).toContain('1 token-backed usages accepted');
  expect(validationResults.some((result) => result.severity === "valid" && result.message === "Uses token reference theme.colors.background.100")).toBe(true);
});