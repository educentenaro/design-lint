import { expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

async function createFixture(hardcoded: boolean): Promise<{ root: string; tokensDir: string; srcDir: string }> {
  const root = await mkdtemp(join(tmpdir(), "design-lint-e2e-"));
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
        color: {
          brand: {
            500: {
              $type: "color",
              $value: "#13544A",
            },
          },
        },
      },
      null,
      2,
    ),
  );

  const componentLines = hardcoded
    ? [
        'export function Button() {',
        '  return <button style={{ color: "#13544A", padding: "12px" }} />;',
        '}',
        '',
      ]
    : [
        'export function Button() {',
        '  return <button style={{ color: theme.colors.brand[500], padding: tokens.spacing.md }} />;',
        '}',
        '',
      ];

  await writeFile(join(srcDir, "Button.tsx"), componentLines.join("\n"));

  return { root, tokensDir, srcDir };
}

test("CLI reports violations and exits with a failure code", async () => {
  const fixture = await createFixture(true);
  try {
    const cliPath = resolve("c:\\tcc", "src", "cli.ts");
    const result = Bun.spawnSync(["bun", cliPath, "--figma", fixture.tokensDir, "--src", fixture.srcDir], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);

    expect(result.exitCode).toBe(1);
    expect(stdout).toContain('Hardcoded color "#13544A"');
    expect(stdout).toContain('Hardcoded spacing "12px"');
    expect(stdout).toContain("Result: failed");
    expect(stderr).toBe("");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("CLI passes when code uses only token references", async () => {
  const fixture = await createFixture(false);
  try {
    const cliPath = resolve("c:\\tcc", "src", "cli.ts");
    const result = Bun.spawnSync(["bun", cliPath, "--figma", fixture.tokensDir, "--src", fixture.srcDir], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const stdout = new TextDecoder().decode(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(stdout).toContain("All tokens correctly used");
    expect(stdout).toContain("Result: passed");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});