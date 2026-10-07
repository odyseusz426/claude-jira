---
description: Pobierz wymagania z ticketu Jira (FAP-XXXX) — opis, KA, komentarze, linked issues
argument-hint: <FAP-XXXX>
---

# /jira — Pobierz wymagania z Jira

**Cel:** Pobranie opisu, acceptance criteria, komentarzy i linked issues z ticketu Jira i zwrocenie skondensowanego briefu wymagan.

## Agent (delegacja — WYMAGANE)

| Subagent (`name`) | Model | Rola |
|-------------------|-------|------|
| `jira-reader` | haiku | pobiera issue z Jira, kondensuje do briefu |

Deleguj do subagenta narzedziem Task. Agent zwraca brief — sesja glowna prezentuje uzytkownikowi.

```
/jira FAP-1234
```

---

## Krok 1: Walidacja

Sprawdz czy argument zawiera klucz issue (format: `FAP-XXXX`). Jesli brak — zapytaj uzytkownika o numer.

---

## Krok 2: Delegacja

Deleguj do `jira-reader` z kluczem issue.

Agent:
1. Laczy sie z `transeu.atlassian.net` przez Atlassian MCP
2. Pobiera opis, acceptance criteria, komentarze, linked issues, parent epic
3. Kondensuje do briefu (surowy payload zostaje wewnatrz agenta)
4. Zwraca brief w formacie: issue line, **Requirements**, **Open questions**

---

## Krok 3: Prezentacja

Pokaz brief uzytkownikowi. Brief moze byc uzywany jako input do `/task` lub `/propose`.

---

## Wymagania

Atlassian MCP musi byc skonfigurowany i zaautoryzowany: `/mcp` -> `atlassian` -> Authenticate.

## WAZNE

- **Read-only** — agent NIGDY nie pisze do Jiry (brak narzedzi `executeWrite`/`executeDestructive`)
- Agent nie planuje zmian w kodzie — zwraca tylko brief wymagan
- Komentarze sa kluczowe — tam czesto siedza prawdziwe wymagania
