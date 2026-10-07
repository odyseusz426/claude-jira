import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const cli = join(import.meta.dirname, "..", "bin", "cli.js");

function run(args, opts = {}) {
  return execFileSync("node", [cli, ...args], {
    encoding: "utf8",
    timeout: 5000,
    ...opts,
  });
}

describe("claude-jira CLI", () => {
  it("--version prints version", () => {
    const out = run(["--version"]);
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it("-v prints version", () => {
    const out = run(["-v"]);
    assert.match(out.trim(), /^\d+\.\d+\.\d+$/);
  });

  it("no args prints usage and exits 0", () => {
    const out = run([]);
    assert.ok(out.includes("claude-jira init"));
  });

  it("unknown command exits 1", () => {
    assert.throws(() => run(["nope"]), (err) => err.status === 1);
  });

  describe("init", () => {
    let tmp;

    before(() => {
      tmp = mkdtempSync(join(tmpdir(), "claude-jira-test-"));
    });

    after(() => {
      rmSync(tmp, { recursive: true, force: true });
    });

    it("fails without .claude/ directory", () => {
      assert.throws(
        () => run(["init"], { cwd: tmp }),
        (err) => {
          assert.ok(err.stderr.includes("Brak katalogu .claude/"));
          return err.status === 1;
        }
      );
    });

    it("copies agents, commands, skills and merges .mcp.json", () => {
      mkdirSync(join(tmp, ".claude"), { recursive: true });
      const out = run(["init"], { cwd: tmp });

      assert.ok(out.includes("jira agents"));
      assert.ok(out.includes("jira commands"));
      assert.ok(out.includes("jira skills"));
      assert.ok(out.includes("atlassian mcp config"));

      assert.ok(existsSync(join(tmp, ".claude", "agents", "jira-reader.md")));
      assert.ok(existsSync(join(tmp, ".claude", "agents", "task-writer.md")));
      assert.ok(existsSync(join(tmp, ".claude", "commands", "jira.md")));
      assert.ok(existsSync(join(tmp, ".claude", "commands", "task.md")));
      assert.ok(existsSync(join(tmp, ".claude", "skills", "jira-read", "SKILL.md")));

      const mcp = JSON.parse(readFileSync(join(tmp, ".claude", ".mcp.json"), "utf8"));
      assert.ok(mcp.mcpServers);
    });

    it("refuses to overwrite without --force", () => {
      assert.throws(
        () => run(["init"], { cwd: tmp }),
        (err) => err.status === 1
      );
    });

    it("overwrites with --force", () => {
      const out = run(["init", "--force"], { cwd: tmp });
      assert.ok(out.includes("nadpisano"));
    });

    it("merges .mcp.json preserving existing servers", () => {
      const mcpPath = join(tmp, ".claude", ".mcp.json");
      const existing = JSON.parse(readFileSync(mcpPath, "utf8"));
      existing.mcpServers["my-custom-server"] = { url: "http://localhost:3000" };
      writeFileSync(mcpPath, JSON.stringify(existing));

      run(["init", "--force"], { cwd: tmp });

      const merged = JSON.parse(readFileSync(mcpPath, "utf8"));
      assert.ok(merged.mcpServers["my-custom-server"], "custom server should be preserved");
    });
  });
});
