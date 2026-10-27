#!/usr/bin/env node
import { readFileSync, writeFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
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

function copy(from, to, label) {
  if (!existsSync(from)) {
    console.error(`Zrodlo nie znalezione: ${from}`);
    process.exit(1);
  }
  if (existsSync(to) && !force) {
    console.error(`Cel juz istnieje: ${to}`);
    console.error(`Uzyj --force zeby nadpisac.`);
    process.exit(1);
  }
  cpSync(from, to, { recursive: true, force });
  console.log(`\u2713 ${label || from} \u2192 ${to}${force ? " (nadpisano)" : ""}`);
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

    // Install agents and commands to ~/.sdd/.claude/ (global)
    const agentsDst = join(sddHome, ".claude", "agents");
    const commandsDst = join(sddHome, ".claude", "commands");
    const skillsDst = join(sddHome, ".claude", "skills");

    copy(agentsSrc, agentsDst, "jira agents → ~/.sdd/.claude/agents");
    copy(commandsSrc, commandsDst, "jira commands → ~/.sdd/.claude/commands");
    copy(skillsSrc, skillsDst, "jira skills → ~/.sdd/.claude/skills");

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

Po instalacji autoryzuj: /mcp → atlassian → Authenticate

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
