---
name: jira-read
description: Jak czytać issue Jira (PROJ-numer) — opis, kryteria akceptacji, komentarze, powiązane issue — i skondensować w brief wymagań. Read-only; nigdy nie zapisuje do Jiry.
when_to_use: Ładowany przez subagenta `jira-reader`. W głównym wątku deleguj do tego agenta zamiast czytać ten skill — dzięki temu surowy payload Jiry nie trafi do głównego okna kontekstu.
---

# Czytanie issue Jiry

Instancja: wykrywana automatycznie przez `getAccessibleAtlassianResources`. Nazwy narzędzi poniżej są zapisane bez prefiksu.

## Główna zasada

**Read-only.** Nie twórz issue, nie zmieniaj statusów, nie dodawaj komentarzy.

## Co zebrać

1. Opis issue i jego kryteria akceptacji.
2. **Komentarze** — prawdziwe wymagania bardzo często żyją tam, a nie w opisie.
   `getJiraIssue` zwraca tylko ich *liczbę*, więc zawsze potrzebne jest drugie wywołanie:
   `discover` ("list jira issue comments") i uruchomienie operacji którą wskaże przez `executeRead`.
3. Powiązane issue i epik nadrzędny, jeśli istnieją.

## Co z tym zrobić

Skondensuj w brief wymagań. **Nie planujesz zmian w kodzie** — sesja główna tym się zajmuje,
bo ma repozytorium w kontekście. Twoja praca kończy się na jasnym, jednoznacznym opisie
tego, czego wymaga issue.

Jedna flaga platformowa warta podniesienia, bo łatwo ją przeoczyć a widać z ticketu:
jeśli issue wymaga **nowego serwisu, eventu lub feature flaga**, zanotuj że oznacza to
zmianę deskryptora we **wszystkich trzech** `tfc-configs` (dev, rc, prod), nie tylko import w kodzie.

##Output

Zwróć szczegółowy brief w formie zdefiniowanej przez `jira-reader`: linia issue, **Wymagania**,
**Otwarte pytania**. Streszczaj — celem tego skilla jest to, żeby surowy opis i wątek
komentarzy nigdy nie opuściły agenta.

## Czego nie robić

**Nie zgaduj gdy issue jest niedospecyfikowane.** Brakujące kryteria akceptacji, sprzeczność
lub niejednoznaczność -> powiedz wprost i zapytaj. Niedospecyfikowany task zaimplementowany
z pewnością siebie jest gorszy niż pytanie.
