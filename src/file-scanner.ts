import { extname, join, resolve } from "node:path";
import { readdir, stat } from "node:fs/promises";
import { SUPPORTED_SOURCE_EXTENSIONS, type SupportedSourceExtension } from "./types";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".bun",
  ".cache",
  "out",
]);

export async function collectSourceFiles(rootPath: string): Promise<string[]> {
  const resolvedPath = resolve(rootPath);
  const stats = await stat(resolvedPath);

  if (stats.isFile()) {
    return isSupportedSourceFile(resolvedPath) ? [resolvedPath] : [];
  }

  const files = await walkDirectory(resolvedPath);
  files.sort((left, right) => left.localeCompare(right));
  return files;
}

async function walkDirectory(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }

      files.push(...(await walkDirectory(join(directoryPath, entry.name))));
      continue;
    }

    if (entry.isFile()) {
      const filePath = join(directoryPath, entry.name);

      if (isSupportedSourceFile(filePath)) {
        files.push(filePath);
      }
    }
  }

  return files;
}

function isSupportedSourceFile(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase();
  return (SUPPORTED_SOURCE_EXTENSIONS as readonly string[]).includes(extension as SupportedSourceExtension);
}
