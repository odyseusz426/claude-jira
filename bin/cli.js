#!/usr/bin/env node
import { readFileSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templates = join(root, "templates");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const [command, ...args] = process.argv.slice(2);
const force = args.includes("--force");

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
    const cwd = process.cwd();
    if (!existsSync(join(cwd, ".claude"))) {
      console.error(
        "Brak katalogu .claude/ w biezacym projekcie.\n" +
        "Najpierw uruchom: npx @odyseusz426/claude-npm-sdd init (sdd init)"
      );
      process.exit(1);
    }
    const agentsSrc = join(templates, ".claude", "agents");
    const commandsSrc = join(templates, ".claude", "commands");
    const skillsSrc = join(templates, ".claude", "skills");
    const mcpSrc = join(templates, ".claude", ".mcp.json");
    const agentsDst = join(cwd, ".claude", "agents");
    const commandsDst = join(cwd, ".claude", "commands");
    const skillsDst = join(cwd, ".claude", "skills");
    const mcpDst = join(cwd, ".claude", ".mcp.json");

    copy(agentsSrc, agentsDst, "jira agents");
    copy(commandsSrc, commandsDst, "jira commands");
    copy(skillsSrc, skillsDst, "jira skills");
    // Merge .mcp.json instead of overwriting — preserve existing MCP servers
    const mcpSnippet = JSON.parse(readFileSync(mcpSrc, "utf8"));
    let mcpTarget = {};
    if (existsSync(mcpDst)) {
      mcpTarget = JSON.parse(readFileSync(mcpDst, "utf8"));
    }
    mcpTarget.mcpServers = { ...mcpTarget.mcpServers, ...mcpSnippet.mcpServers };
    writeFileSync(mcpDst, JSON.stringify(mcpTarget, null, 2) + "\n");
    console.log(`\u2713 atlassian mcp config \u2192 ${mcpDst} (merged)`);

    console.log(`
Jira toolkit zainstalowany.

Komendy:  /task
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
  claude-jira init              kopiuje agentow, skille, komendy i MCP config do projektu
  claude-jira init --force      nadpisuje istniejace pliki
  claude-jira --version         pokaz wersje
`);
    process.exit(command ? 1 : 0);
}
