#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, symlinkSync, lstatSync, unlinkSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templates = join(root, "templates");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const [command, ...args] = process.argv.slice(2);
const force = args.includes("--force");

const sddHome = join(homedir(), ".sdd");
const userClaude = join(homedir(), ".claude");
const isWin = process.platform === "win32";

function portableLink(target, linkPath) {
  try {
    const stat = lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      if (force) unlinkSync(linkPath);
      else return;
    } else if (stat.isDirectory() || stat.isFile()) {
      if (!force) {
        console.error(`Cel juz istnieje: ${linkPath}`);
        console.error(`Uzyj --force zeby nadpisac.`);
        process.exit(1);
      }
      if (isWin) {
        cpSync(target, linkPath, { recursive: true, force: true });
        return;
      }
      unlinkSync(linkPath);
    }
  } catch { /* doesn't exist */ }

  if (isWin) {
    try {
      if (statSync(target).isDirectory()) {
        symlinkSync(target, linkPath, "junction");
        return;
      }
    } catch { /* */ }
    mkdirSync(dirname(linkPath), { recursive: true });
    copyFileSync(target, linkPath);
    return;
  }

  mkdirSync(dirname(linkPath), { recursive: true });
  symlinkSync(target, linkPath);
}

function linkDir(srcDir, dstDir, label) {
  if (!existsSync(srcDir)) {
    console.error(`Zrodlo nie znalezione: ${srcDir}`);
    process.exit(1);
  }
  if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });

  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      linkDir(src, dst);
    } else {
      portableLink(src, dst);
    }
  }
  console.log(`\u2713 ${label || srcDir} \u2192 ${dstDir}${force ? " (nadpisano)" : ""}`);
}

switch (command) {
  case "init": {
    if (!existsSync(join(sddHome, ".claude"))) {
      console.error(
        "SDD framework nie jest zainstalowany.\n" +
        "Najpierw uruchom: npm i -g @odyseusz426/claude-npm-sdd && sdd init"
      );
      process.exit(1);
    }

    const agentsSrc = join(templates, ".claude", "agents");
    const commandsSrc = join(templates, ".claude", "commands");
    const skillsSrc = join(templates, ".claude", "skills");
    const mcpSrc = join(templates, ".claude", ".mcp.json");

    // Link agents, commands, skills to ~/.sdd/.claude/ (global)
    const agentsDst = join(sddHome, ".claude", "agents");
    const commandsDst = join(sddHome, ".claude", "commands");
    const skillsDst = join(sddHome, ".claude", "skills");

    linkDir(agentsSrc, agentsDst, "jira agents \u2192 ~/.sdd/.claude/agents");
    linkDir(commandsSrc, commandsDst, "jira commands \u2192 ~/.sdd/.claude/commands");
    linkDir(skillsSrc, skillsDst, "jira skills \u2192 ~/.sdd/.claude/skills");

    // Merge .mcp.json into ~/.claude/.mcp.json (user-level MCP config)
    const mcpDst = join(userClaude, ".mcp.json");
    const mcpSnippet = JSON.parse(readFileSync(mcpSrc, "utf8"));
    let mcpTarget = {};
    if (existsSync(mcpDst)) {
      mcpTarget = JSON.parse(readFileSync(mcpDst, "utf8"));
    }
    mcpTarget.mcpServers = { ...mcpTarget.mcpServers, ...mcpSnippet.mcpServers };
    writeFileSync(mcpDst, JSON.stringify(mcpTarget, null, 2) + "\n");
    console.log(`\u2713 atlassian mcp config \u2192 ~/.claude/.mcp.json (merged)`);

    console.log(`
Jira toolkit zainstalowany globalnie.

Komendy:  /task, /jira
Agenci:   task-writer, jira-reader
Skille:   jira-read
MCP:      atlassian (auto-detect instancji)

Po instalacji autoryzuj: /mcp \u2192 atlassian \u2192 Authenticate

Wymaga @odyseusz426/claude-npm-sdd jako bazowy framework.
`);
    break;
  }
  case "--version":
  case "-v":
    console.log(pkg.version);
    break;
  default:
    console.log(`
Claude Jira v${pkg.version} \u2014 integracja z Jira

Uzycie:
  claude-jira init              instaluje agentow, skille, komendy globalnie (~/.sdd/.claude/)
  claude-jira init --force      nadpisuje istniejace pliki
  claude-jira --version         pokaz wersje
`);
    process.exit(command ? 1 : 0);
}
