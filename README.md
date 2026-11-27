# Toolbox – Web-Tools und KI-Skills aus dem Kurs

Eine Sammlung von **Web-Tools** (Websites, Apps, Browser-Erweiterungen) und **KI-Skills** (Prompts, die wir mit ChatGPT, Claude, Copilot & Co. gebaut haben). Jeder Eintrag ist eine Markdown-Datei. Daraus baut GitHub automatisch die Website mit Suche, Filtern, Merkliste und Kopier-Button.

```
web-tools/   → ein Web-Tool pro Datei
ki-skills/   → ein KI-Skill pro Datei
```

## So kommt ein neuer Eintrag in die Toolbox

1. Jemand füllt eines der beiden Formulare aus: **«KI-Skill einreichen»** oder **«Web-Tool empfehlen»** (Reiter *Issues* → *New issue*, oder auf der Website der Knopf «+ Einreichen»).
2. Eine Moderatorin liest die Einreichung. Bei Bedarf bearbeitet sie das Issue direkt (Tippfehler, Kategorie anpassen).
3. Sie setzt das Label **`freigegeben`**. Danach geht alles automatisch: Die Datei wird angelegt, das Issue geschlossen und die Website in ein bis zwei Minuten aktualisiert.

Nur Personen mit Schreibrechten im Repository können Labels setzen. Fremde können also etwas einreichen, aber nichts selbst veröffentlichen.

**Worauf beim Freigeben achten:**
- Führt der Link auf die offizielle Seite des Tools?
- Verlangt ein Prompt, dass Nutzer:innen persönliche Daten eingeben oder etwas an eine fremde Adresse schicken?
- Stehen Namen oder vertrauliche Kursinhalte drin, die nicht öffentlich sein sollen?

Die Website zeigt alle Texte nur als reinen Text an. HTML oder Skripte in einem Eintrag werden nicht ausgeführt, und Links müssen mit `https://` oder `http://` beginnen.

## Einmalige Einrichtung

1. **GitHub Pages einschalten:** *Settings* → *Pages* → bei *Source* «GitHub Actions» wählen.
2. **Seite veröffentlichen:** *Actions* → «Seite veröffentlichen» → *Run workflow*. Die Adresse steht danach unter *Settings* → *Pages*.
3. **Moderator:innen einladen:** *Settings* → *Collaborators* → Personen mit Rolle «Write» hinzufügen.

Die Labels `freigegeben` und `eingereicht` sind bereits angelegt.

## Passwortschutz (optional)

GitHub Pages ist grundsätzlich öffentlich. Wer die Seite schützen will:

*Settings* → *Secrets and variables* → *Actions* → *New repository secret*
- Name: `SITE_PASSWORD`
- Wert: das gewünschte Passwort

Beim nächsten Veröffentlichen wird die Seite mit [StatiCrypt](https://github.com/robinmoisson/staticrypt) verschlüsselt. Das reicht für eine Kurs-Toolbox, ist aber nicht für wirklich vertrauliche Daten gedacht. Achtung: Ist das Repository öffentlich, sind die Markdown-Dateien und Issues auf GitHub trotzdem für alle sichtbar.

## Einträge von Hand hinzufügen oder ändern

*Add file* → *Create new file* im passenden Ordner. Der Dateiname wird zur Adresse des Eintrags (`…/#feedback-coach`).

**Web-Tool** (`web-tools/notebooklm.md`):

```markdown
---
name: NotebookLM
kategorie: research
von: Julian
plattform: Web
url: https://notebooklm.google.com/
beschreibung: Quellen zu einem Thema sammeln, ordnen und zusammenfassen.
tags: Quellen, Zusammenfassung, Podcast
hinzugefuegt: 2026-11-27
---

## So kannst du es einsetzen

Füge eigene Dokumente hinzu und erstelle daraus eine Mindmap oder ein Quiz.
```

**KI-Skill** (`ki-skills/feedback-coach.md`):

```markdown
---
name: Feedback-Coach für Texte
kategorie: writing
von: Sharon
plattform: ChatGPT
beschreibung: Gibt konstruktives Feedback zu eigenen Texten.
tags: Feedback, Schreiben
hinzugefuegt: 2026-11-27
---

## Wofür ich es verwendet habe

…

## Wo man es sonst einsetzen könnte

…

## Prompt

Hier steht der Prompt. Alles nach «## Prompt» wird unverändert übernommen.
```

`## Prompt` muss der letzte Abschnitt sein. Der Prompt selbst darf Überschriften, Listen usw. enthalten.

**Kategorien** (Feld `kategorie`, Schlüssel oder Bezeichnung):

| Schlüssel | Bezeichnung |
|---|---|
| `research` | KI & Recherche |
| `design` | Design & Bild |
| `writing` | Text & Dokumente |
| `media` | Audio & Video |
| `access` | Barrierefreiheit |
| `work` | Produktivität |
| `files` | Dateien |

Mehrere Namen bei `von` und mehrere `tags` werden mit Komma getrennt. `hinzugefuegt` steuert die Sortierung «Neueste zuerst».

## Anpassen

- Titel, Texte im Kopfbereich und Kategorien: `katalog.config.json` (neue Kategorien auch in den beiden Formularen unter `.github/ISSUE_TEMPLATE/` ergänzen)
- Aussehen: `src/style.css`
- Formularfelder: `.github/ISSUE_TEMPLATE/*.yml` (wenn du Beschriftungen änderst, auch `scripts/issue-to-eintrag.mjs` anpassen)

## Lokal ansehen

```bash
node scripts/build.mjs
# danach dist/index.html im Browser öffnen
```
