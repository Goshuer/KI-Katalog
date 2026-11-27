---
name: Quellen-Check
kategorie: research
von: Beispiel
plattform: Claude
beschreibung: Prüft, ob Aussagen in einem Text durch die angegebenen Quellen gedeckt sind.
tags: Quellen, Faktencheck, Studium
hinzugefuegt: 2026-11-27
---

## So funktioniert es

Du lädst deinen Text und die Quellen hoch. Der Skill geht den Text Aussage für Aussage durch und zeigt in einer Tabelle, welche Aussagen belegt sind und wo.

## Wofür ich es verwendet habe

Für die Gruppenarbeit habe ich unseren Entwurf zusammen mit den PDFs der Quellen hochgeladen. Das Tool hat markiert, welche Aussagen belegt sind, welche nur teilweise und wo eine Quelle fehlt.

## Könnte man auch brauchen für

Faktencheck von Medienmitteilungen, Zusammenfassungen überprüfen, die eine KI erstellt hat, Literaturverzeichnis vor der Abgabe kontrollieren.

## Prompt

Ich gebe dir einen Text und die Quellen, auf die er sich stützt.

Gehe den Text Aussage für Aussage durch und erstelle eine Tabelle mit diesen Spalten:
1. Aussage (kurz zusammengefasst)
2. Beleg: «gedeckt», «teilweise gedeckt» oder «nicht gedeckt»
3. Fundstelle in der Quelle (Seite oder Abschnitt)
4. Kommentar

Erfinde keine Fundstellen. Wenn du eine Aussage in den Quellen nicht findest, schreibe «nicht gedeckt».
