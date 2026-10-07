---
description: Napisz zadanie developerskie na podstawie epika/wymagań — gotowe do wklejenia do Jira
argument-hint: [<opis-lub-epic>]
---

# /task — Napisz zadanie developerskie

**Cel:** Przekształć epik, dokumentację lub opis biznesowy w gotowy ticket Jira (Description, KA, Test info, Tech info).

## Agent (delegacja — WYMAGANE)

| Subagent (`name`) | Model | Rola |
|-------------------|-------|------|
| `task-writer` | inherit | analiza kodu + pisanie zadania |

❗ Deleguj do subagenta narzędziem Task. Agent zwraca zadanie w raporcie — sesja główna prezentuje do akceptacji.

```
/task <opis epika lub link do dokumentacji>

Przykład:
/task "Dodaj notyfikacje o wygasających licencjach w monitoringu"
/task FAP-4521
```

---

## Krok 1: Kontekst

Zbierz od użytkownika:
- Epic / opis biznesowy (Why / How / What)
- Linki do makiet (Axure, Figma) — jeśli są
- Repozytoria do przeszukania — jeśli nie wynikają z CWD

Jeśli użytkownik podał numer ticketu Jira → zapytaj o treść epika (agent nie ma bezpośredniego dostępu do Jira API).

---

## Krok 2: Delegacja

Deleguj do `task-writer` z pełnym kontekstem:
- Treść epika
- Linki do makiet
- Ścieżki repozytoriów do przeszukania

Agent przeszuka kod, zidentyfikuje pliki i napisze zadanie.

---

## Krok 3: Prezentacja

Pokaż zadanie użytkownikowi:

```
## Task: [tytuł]

[treść zadania]

Zatwierdzasz? (tak/nie/popraw)
```

**CZEKAJ NA ZATWIERDZENIE.**

**`tak`** → zapisz do `ai/tasks/` (agent zapisuje sam)
**`popraw: [opis]`** → kontynuuj TEGO SAMEGO subagenta z poprawkami
**`nie`** → porzuć

---

## WAŻNE Rules

❌ **NIGDY:**
- Agent nie zgaduje ścieżek — weryfikuje Grep/Glob/Read
- Nie wpisuj imion/nazwisk osób
- Nie pisz kodu — tylko opis zadania

✅ **ZAWSZE:**
- Przeszukaj kod PRZED pisaniem zadania
- Format: Description → KA → Test info → Tech info
- Zapisz do `ai/tasks/`
