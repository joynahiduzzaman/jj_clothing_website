import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Prisma compiles `contains` to SQL LIKE. On MySQL (this project's database),
 * `mode: "insensitive"` isn't just unnecessary — it's not a valid option at
 * all outside PostgreSQL/MongoDB, so the generated Prisma Client's TypeScript
 * types don't even accept it on this schema; leaving one in would be a build
 * error, not a silent no-op.
 *
 * MySQL doesn't need it: this schema's default collation (utf8mb4_0900_ai_ci /
 * utf8mb4_general_ci — the "ci" suffix is literally "case-insensitive") already
 * matches "snail" against "Snail" for a plain `contains`. This test is the
 * MySQL-era counterpart of the PostgreSQL-era test it replaced (which asserted
 * the opposite, for the opposite reason) — it guards against a copy-pasted
 * `mode: "insensitive"` reappearing if this project is ever moved to Postgres
 * again without re-adding it deliberately, since that would now be dead code
 * silently accepted by a differently-configured client, not a compile error.
 */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      sourceFiles(p, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(p);
    }
  }
  return acc;
}

describe("Prisma string search relies on MySQL's collation, not mode: insensitive", () => {
  it("no `contains:`/`equals:` filter sets mode: insensitive", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(path.resolve(process.cwd(), "src"))) {
      const src = readFileSync(file, "utf8");
      const lines = src.split(/\r?\n/);
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return; // comments, not code
        if (/mode:\s*["']insensitive["']/.test(line)) {
          offenders.push(`${path.relative(process.cwd(), file)}:${i + 1}  ${trimmed}`);
        }
      });
    }

    expect(
      offenders,
      `mode: "insensitive" isn't a valid Prisma option on MySQL and isn't needed ` +
        `for case-insensitive search here (the schema's default collation already ` +
        `handles that) — remove it:\n  ${offenders.join("\n  ")}`
    ).toEqual([]);
  });
});
