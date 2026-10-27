import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const cli = join(import.meta.dirname, "..", "bin", "cli.js");
const sddClaude = join(homedir(), ".sdd", ".claude");
const userMcp = join(homedir(), ".claude", ".mcp.json");

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
    // These tests require SDD to be installed (~/.sdd/.claude/ must exist)
    const sddInstalled = existsSync(sddClaude);

    // Track files we create so we can clean up
    const createdFiles = [];

    after(() => {
      for (const f of createdFiles) {
        rmSync(f, { recursive: true, force: true });
      }
    });

    it("fails when SDD is not installed", () => {
      if (sddInstalled) {
        // Can't test this when SDD is installed — verify init works instead
        const out = run(["init", "--force"]);
        assert.ok(out.includes("jira agents"));
        return;
      }
      assert.throws(
        () => run(["init"]),
        (err) => {
          assert.ok(err.stderr.includes("nie jest zainstalowany"));
          return err.status === 1;
        }
      );
    });

    it("copies agents, commands, skills to ~/.sdd/.claude/", () => {
      if (!sddInstalled) return;

      const out = run(["init", "--force"]);

      assert.ok(out.includes("jira agents"));
      assert.ok(out.includes("jira commands"));
      assert.ok(out.includes("jira skills"));
      assert.ok(out.includes("atlassian mcp config"));

      assert.ok(existsSync(join(sddClaude, "agents", "jira-reader.md")));
      assert.ok(existsSync(join(sddClaude, "agents", "task-writer.md")));
      assert.ok(existsSync(join(sddClaude, "commands", "jira.md")));
      assert.ok(existsSync(join(sddClaude, "commands", "task.md")));
      assert.ok(existsSync(join(sddClaude, "skills", "jira-read", "SKILL.md")));
    });

    it("merges .mcp.json into ~/.claude/.mcp.json", () => {
      if (!sddInstalled) return;

      assert.ok(existsSync(userMcp), "~/.claude/.mcp.json should exist after init");
      const mcp = JSON.parse(readFileSync(userMcp, "utf8"));
      assert.ok(mcp.mcpServers, "should have mcpServers key");
    });

    it("merges .mcp.json preserving existing servers", () => {
      if (!sddInstalled) return;

      // Add a custom server
      const existing = JSON.parse(readFileSync(userMcp, "utf8"));
      existing.mcpServers["my-custom-server"] = { url: "http://localhost:3000" };
      writeFileSync(userMcp, JSON.stringify(existing, null, 2));

      // Re-run init
      run(["init", "--force"]);

      const merged = JSON.parse(readFileSync(userMcp, "utf8"));
      assert.ok(merged.mcpServers["my-custom-server"], "custom server should be preserved");

      // Clean up custom server
      delete merged.mcpServers["my-custom-server"];
      writeFileSync(userMcp, JSON.stringify(merged, null, 2) + "\n");
    });

    it("refuses to overwrite without --force", () => {
      if (!sddInstalled) return;

      // First install
      run(["init", "--force"]);
      // Second install without --force should fail
      assert.throws(
        () => run(["init"]),
        (err) => err.status === 1
      );
    });

    it("overwrites with --force", () => {
      if (!sddInstalled) return;

      const out = run(["init", "--force"]);
      assert.ok(out.includes("nadpisano"));
    });
  });
});
