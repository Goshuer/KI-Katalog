# Toolbox – Web-Tools und KI-Skills aus dem Kurs

Eine Sammlung von **Web-Tools** (Websites, Apps, Browser-Erweiterungen) und **KI-Skills** (Prompts, die wir mit ChatGPT, Claude, Copilot & Co. gebaut haben). Jeder Eintrag ist eine Markdown-Datei. Daraus baut GitHub automatisch die Website mit Suche, Filtern, Merkliste und Kopier-Button.

```
web-tools/   → ein Web-Tool pro Datei
ki-skills/   → ein KI-Skill pro Datei
```

## So kommt ein neuer Eintrag in die Toolbox

1. Jemand klickt auf der Website auf **«+ Einreichen»**, füllt die Eingabemaske aus und gibt den Kurs-Code ein (ohne GitHub-Konto).
2. Der Worker legt ein Issue an und gibt es **automatisch frei**. Ein GitHub-Workflow legt die Datei an, schliesst das Issue und aktualisiert die Website. Nach ein bis zwei Minuten ist der Eintrag online.

**Einen Eintrag ändern oder entfernen:** Im Ordner `web-tools/` bzw. `ki-skills/` die Datei öffnen, oben rechts auf den Stift (bearbeiten) oder auf «⋯» → *Delete file* klicken und mit *Commit changes* bestätigen. Die Website aktualisiert sich danach automatisch.

**Lieber jede Einreichung vorher prüfen?** Im Cloudflare Worker die Variable `AUTO_FREIGABE` (Text) mit dem Wert `nein` anlegen. Dann warten Einreichungen in der **Moderation** (Link unten auf der Website oder `…/#moderation`, Anmeldung mit `MOD_CODE`) und werden dort mit einem Klick freigegeben oder abgelehnt. In GitHub geht das auch: Issue öffnen und das Label **`freigegeben`** setzen.

**Worauf beim Prüfen achten:**
- Führt der Link auf die offizielle Seite des Tools?
- Verlangt ein Prompt, dass Nutzer:innen persönliche Daten eingeben oder etwas an eine fremde Adresse schicken?
- Stehen Namen oder vertrauliche Kursinhalte drin, die nicht öffentlich sein sollen?

Die Website zeigt alle Texte nur als reinen Text an. HTML oder Skripte in einem Eintrag werden nicht ausgeführt, und Links müssen mit `https://` oder `http://` beginnen.

## Einmalige Einrichtung

1. **GitHub Pages einschalten:** *Settings* → *Pages* → bei *Source* «GitHub Actions» wählen.
2. **Seite veröffentlichen:** *Actions* → «Seite veröffentlichen» → *Run workflow*. Die Adresse steht danach unter *Settings* → *Pages*.
3. **Moderator:innen einladen:** *Settings* → *Collaborators* → Personen mit Rolle «Write» hinzufügen.

Die Labels `freigegeben` und `eingereicht` sind bereits angelegt.

## Eingabemaske einrichten (Cloudflare Worker)

Die Website ist statisch und darf selbst nichts auf GitHub schreiben. Ein kleiner Cloudflare Worker (gratis) nimmt die Einreichungen entgegen und legt sie als Issue an. Der Code liegt in `worker/einreichen.js`. Solange kein Worker eingerichtet ist, führt «+ Einreichen» zu den GitHub-Formularen.

**1. GitHub-Token erstellen**
GitHub → Profilbild → *Settings* → *Developer settings* → *Personal access tokens* → *Fine-grained tokens* → *Generate new token*
- *Repository access*: «Only select repositories» → `KI-Katalog`
- *Permissions* → *Repository permissions* → **Issues: Read and write** (sonst nichts)
- Ablaufdatum: z. B. Ende des Kurses
- Token kopieren (wird nur einmal angezeigt)

**2. Worker anlegen**
[dash.cloudflare.com](https://dash.cloudflare.com) (Gratiskonto) → *Workers & Pages* → *Create* → *Worker* → Namen wählen (z. B. `toolbox-einreichen`) → *Deploy* → *Edit code* → den ganzen Inhalt von `worker/einreichen.js` einfügen → *Deploy*

**3. Einstellungen im Worker**
*Settings* → *Variables and Secrets* → *Add*:

| Name | Typ | Wert |
|---|---|---|
| `REPO` | Text | `Goshuer/KI-Katalog` |
| `ALLOWED_ORIGIN` | Text | `https://goshuer.github.io` |
| `GITHUB_TOKEN` | Secret | der Token aus Schritt 1 |
| `KURS_CODE` | Secret | ein Code für den Kurs, z. B. `toolbox26` |
| `MOD_CODE` | Secret | optional: Passwort für die Moderation |
| `AUTO_FREIGABE` | Text | optional: `nein`, wenn jede Einreichung vorher geprüft werden soll |

**4. Adresse eintragen**
Die Adresse des Workers (`https://toolbox-einreichen.<name>.workers.dev`) in `katalog.config.json` bei `einreichen.endpoint` eintragen. Ohne `KURS_CODE` im Worker `kursCode` auf `false` setzen.

Schutz vor Missbrauch: Nur die eigene Website darf einreichen (`ALLOWED_ORIGIN`), es braucht den Kurs-Code, ein unsichtbares Feld fängt Spam-Bots ab, und nichts erscheint ohne Freigabe.

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

## So funktioniert es

Füge eigene Dokumente hinzu und erstelle daraus eine Mindmap oder ein Quiz.

## Könnte man auch brauchen für

Prüfungsvorbereitung, Einarbeitung in ein neues Thema.
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

## So funktioniert es

…

## Wofür ich es verwendet habe

…

## Könnte man auch brauchen für

…

## Prompt

Hier steht der Prompt. Alles nach «## Prompt» wird unverändert übernommen.
```

Das Feld `beschreibung` ergänzt den Satz «Das Tool ist für …». Die Abschnitte sind freiwillig, ausser `## Prompt` bei KI-Skills. `## Prompt` muss der letzte Abschnitt sein. Der Prompt selbst darf Überschriften, Listen usw. enthalten.

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
- Felder: Eingabemaske in `src/index.html`, GitHub-Formulare in `.github/ISSUE_TEMPLATE/*.yml`. Die Beschriftungen müssen mit `worker/einreichen.js` und `scripts/issue-to-eintrag.mjs` übereinstimmen.

## Lokal ansehen

```bash
node scripts/build.mjs
# danach dist/index.html im Browser öffnen
```
