# @odyseusz426/claude-jira

Rozszerzenie SDD Framework — integracja z Jira: czytanie ticketow i pisanie zadan developerskich z analiza kodu.

## Wymagania

- `@odyseusz426/claude-npm-sdd` zainstalowany i zainicjalizowany (`sdd init`)

## Instalacja

```bash
# Skonfiguruj registry (jednorazowo)
echo "@odyseusz426:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Zainstaluj globalnie
npm i -g @odyseusz426/claude-jira
```

## Uzycie

```bash
# W katalogu projektu (po sdd init):
claude-jira init               # kopiuje agentow, komendy, skille i MCP config
claude-jira init --force       # nadpisuje istniejace pliki
claude-jira --version          # wersja paczki
```

## Po instalacji

```
# Autoryzacja Jira (jednorazowo):
/mcp → atlassian → Authenticate

# W Claude Code:
/jira PROJ-1234
/task "Dodaj notyfikacje o wygasajacych licencjach w monitoringu"
```

## Co robi

### `/jira PROJ-XXXX` — Czytanie ticketow z Jiry

Agent `jira-reader` (model: haiku) pobiera issue z instancji Jira (auto-detect przez Atlassian MCP):
1. Opis i acceptance criteria
2. Komentarze (tam czesto siedza prawdziwe wymagania)
3. Linked issues i parent epic
4. Kondensuje do briefu wymagan — surowy payload zostaje wewnatrz agenta

Brief moze byc uzywany jako input do `/task` lub `/propose`.

**Read-only** — agent nigdy nie pisze do Jiry.

### `/task` — Pisanie zadan developerskich

Agent `task-writer` na podstawie epika/opisu biznesowego:
1. Przeszukuje kod w repozytoriach projektu (Grep/Glob/Read)
2. Identyfikuje istniejace kontrolery, endpointy, DTO, testy
3. Generuje zadanie w formacie: **Description -> KA -> Test info -> Tech info**
4. Zapisuje do `ai/tasks/`

### Format zadania

- **Description** — historia uzytkownika, kontekst biznesowy (proza)
- **KA** — drobiazgowa lista wymagan funkcjonalnych (teksty PL/ENG, stany, warunki)
- **Test info** — scenariusze testowe (punktowo)
- **Tech info** — pliki w repo, kroki implementacji, zaleznosci, linki do makiet

## Architektura

```
templates/.claude/
├── .mcp.json                          Atlassian MCP server config
├── agents/
│   ├── jira-reader.md                 subagent: czyta issue z Jiry (haiku)
│   └── task-writer.md                 subagent: pisze zadania z analiza kodu
├── commands/
│   ├── jira.md                        komenda /jira
│   └── task.md                        komenda /task
└── skills/
    └── jira-read/
        └── SKILL.md                   instrukcja czytania issue (ladowana przez jira-reader)
```

## Licencja

MIT
