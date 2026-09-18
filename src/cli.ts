#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { loadConfig, type ProjectConfig } from "./config.js";
import { scan } from "./scan.js";
import { formatReport } from "./reporter.js";

const usage = `design-lint — React design token linting

Usage: design-lint scan [options]

Options:
  --figma, -f <path>       Tokens JSON file or directory (default: tokens.json)
  --src, -s <path>         Source directory or file (default: src)
  --config, -c <path>      JSON config (default: ./design-lint.config.json)
  --format <text|json>    Report format
  --fail-on-warnings     Fail on warnings as well as errors
  --help, -h             Show help
  --version, -v          Show version

Config supports figma, src, exclude (paths), format and failOnWarnings.
Config paths are relative to its directory; CLI paths to the working directory.
Exit codes: 0 passed; 1 lint violations; 2 configuration, I/O or parse failure.
Legacy invocation without "scan" remains supported.`;

async function main() {
  try {
    const { values, positionals } = parseArgs({
      options: {
        figma: { type: "string", short: "f" },
        src: { type: "string", short: "s" },
        config: { type: "string", short: "c" },
        format: { type: "string" },
        "fail-on-warnings": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: true,
      strict: true,
    });
    if (positionals.length > 1 || (positionals.length === 1 && positionals[0] !== "scan")) {
      throw new Error(`Unknown command: ${positionals.join(" ")}. Use "design-lint scan".`);
    }
    if (values.help || process.argv.length === 2) { console.log(usage); return; }
    if (values.version) {
      const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
      console.log(pkg.version);
      return;
    }
    if (values.format !== undefined && values.format !== "text" && values.format !== "json") throw new Error("--format must be text or json");
    for (const key of ["figma", "src", "config"] as const) {
      if (values[key] !== undefined && !values[key]!.trim()) throw new Error(`--${key} requires a non-empty path`);
    }
    const overrides: ProjectConfig = {};
    if (values.figma !== undefined) overrides.figma = values.figma;
    if (values.src !== undefined) overrides.src = values.src;
    if (values.format !== undefined) overrides.format = values.format;
    if (values["fail-on-warnings"] !== undefined) overrides.failOnWarnings = values["fail-on-warnings"];
    const config = await loadConfig(overrides, values.config);
    const { files, results } = await scan(config);
    const report = formatReport(results, config.basePath, config.failOnWarnings);
    const failed = report.summary.error > 0 || (config.failOnWarnings && report.summary.warning > 0);
    console.log(config.format === "json"
      ? JSON.stringify({ files, results, summary: report.summary, passed: !failed }, null, 2)
      : `Scanned ${files.length} file${files.length === 1 ? "" : "s"}\n\n${report.text}`);
    process.exitCode = failed ? 1 : 0;
  } catch (error) {
    console.error(`design-lint: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}

await main();
