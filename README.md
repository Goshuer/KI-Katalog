# KI-Toolkatalog

Ein Katalog für die KI-Tools und Prompts aus unserem Kurs. Jedes Tool ist eine Markdown-Datei im Ordner `tools/`. Daraus baut GitHub automatisch eine Website mit Suche, Filtern und einem Kopier-Button.

## So kommt ein neues Tool in den Katalog

1. Jemand füllt das Formular **«Neues Tool einreichen»** aus (Reiter *Issues* → *New issue*, oder auf der Website der Knopf «Tool einreichen»).
2. Eine Moderatorin liest die Einreichung. Bei Bedarf kann sie das Issue direkt bearbeiten (Tippfehler, Kategorie anpassen).
3. Sie setzt das Label **`freigegeben`**. Danach geht alles automatisch: Die Datei wird angelegt, das Issue geschlossen und die Website in ein bis zwei Minuten aktualisiert.

Nur Personen mit Schreibrechten im Repository können Labels setzen. Fremde können also etwas einreichen, aber nichts selbst veröffentlichen.

**Worauf beim Freigeben achten:**
- Führen Links im Text auf seriöse Seiten?
- Verlangt der Prompt, dass Nutzer:innen persönliche Daten eingeben oder etwas an eine fremde Adresse schicken?
- Stehen Namen oder vertrauliche Kursinhalte drin, die nicht öffentlich sein sollen?

Die Website zeigt alle Texte nur als reinen Text an. HTML oder Skripte in einem Prompt werden nicht ausgeführt.

## Einmalige Einrichtung

1. **GitHub Pages einschalten:** *Settings* → *Pages* → bei *Source* «GitHub Actions» wählen.
2. **Labels anlegen:** *Issues* → *Labels* → *New label*: `freigegeben` und `eingereicht`.
3. **Schreibrechte für Workflows:** *Settings* → *Actions* → *General* → *Workflow permissions* → «Read and write permissions».
4. **Moderator:innen einladen:** *Settings* → *Collaborators* → Personen mit Rolle «Write» hinzufügen.
5. Unter *Actions* den Workflow «Seite veröffentlichen» einmal von Hand starten (*Run workflow*). Die Adresse der Seite steht danach unter *Settings* → *Pages*.

## Passwortschutz (optional)

GitHub Pages ist grundsätzlich öffentlich. Wer die Seite schützen will, legt ein Passwort an:

*Settings* → *Secrets and variables* → *Actions* → *New repository secret*
- Name: `SITE_PASSWORD`
- Wert: das gewünschte Passwort

Beim nächsten Veröffentlichen wird die Seite mit [StatiCrypt](https://github.com/robinmoisson/staticrypt) verschlüsselt. Ohne Passwort ist der Inhalt nicht lesbar. Das reicht für einen Kurs-Katalog. Für wirklich vertrauliche Daten ist es nicht gedacht. Achtung: Ist das Repository öffentlich, sind die Markdown-Dateien und Issues dort trotzdem für alle sichtbar. Wer das nicht will, macht das Repository privat (Pages aus privaten Repositories braucht bei persönlichen Konten GitHub Pro).

## Ein Tool von Hand hinzufügen

Im Ordner `tools/` eine neue Datei anlegen, zum Beispiel `mein-tool.md` (*Add file* → *Create new file*):

```markdown
---
titel: Name des Tools
erstellt_von: Vorname
plattform: ChatGPT
kategorie: Schreiben, Lernen
kurzbeschreibung: Ein Satz, was das Tool macht.
---

## Wofür ich es verwendet habe

…

## Wo man es sonst einsetzen könnte

…

## Prompt

Hier steht der Prompt. Alles nach «## Prompt» wird unverändert übernommen.
```

`## Prompt` muss der letzte Abschnitt sein. Der Prompt selbst darf Überschriften, Listen usw. enthalten.

## Anpassen

- Titel und Untertitel der Seite: `katalog.config.json`
- Aussehen: `src/style.css`
- Felder des Einreichungsformulars: `.github/ISSUE_TEMPLATE/neues-tool.yml` (wenn du Beschriftungen änderst, auch `scripts/issue-to-tool.mjs` anpassen)

## Lokal ansehen

```bash
node scripts/build.mjs
# danach dist/index.html im Browser öffnen
```
