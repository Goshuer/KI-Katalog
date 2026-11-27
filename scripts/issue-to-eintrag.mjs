// Wandelt ein freigegebenes GitHub-Issue (Formular «KI-Skill einreichen» oder «Web-Tool empfehlen»)
// in eine Datei ki-skills/<name>.md bzw. web-tools/<name>.md um.
// Wird von .github/workflows/tool-aufnehmen.yml aufgerufen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEintrag, kategorieSchluessel, ORDNER } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Diese Beschriftungen müssen genau den "label"-Feldern in .github/ISSUE_TEMPLATE/*.yml entsprechen.
const FELDER = {
  'Name': 'name',
  'Website-Link': 'url',
  'Plattform': 'plattform',
  'Kategorie': 'kategorie',
  'Kurzbeschreibung': 'beschreibung',
  'So kannst du es einsetzen': 'tipp',
  'Wofür hast du es verwendet?': 'einsatz',
  'Wo könnte man es sonst noch einsetzen?': 'weitere',
  'Schlagwörter': 'tags',
  'Erstellt von': 'von',
  'Empfohlen von': 'von',
};
const PROMPT_HEAD = '### Prompt / Anweisungen';

export function parseIssue(body) {
  body = (body || '').replace(/\r\n/g, '\n');
  const leer = (v) => (v.trim() === '_No response_' ? '' : v.trim());

  // Der Prompt ist immer das letzte Feld und wird bis zum Schluss unverändert übernommen.
  const p = body.indexOf(PROMPT_HEAD);
  const typ = p >= 0 ? 'skill' : 'web';
  const werte = { typ };
  if (p >= 0) werte.prompt = leer(body.slice(p + PROMPT_HEAD.length));

  for (const chunk of (p >= 0 ? body.slice(0, p) : body).split(/^### /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const label = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    if (FELDER[label]) werte[FELDER[label]] = leer(nl < 0 ? '' : chunk.slice(nl + 1));
  }
  return werte;
}

const einzeilig = (s = '') => s.replace(/\s+/g, ' ').trim();

export function toMarkdown(e, datum) {
  const kopf = [
    `name: ${einzeilig(e.name)}`,
    `kategorie: ${kategorieSchluessel(e.kategorie, 'Issue')}`,
    `von: ${einzeilig(e.von)}`,
    `plattform: ${einzeilig(e.plattform)}`,
    ...(e.typ === 'web' ? [`url: ${einzeilig(e.url)}`] : []),
    `beschreibung: ${einzeilig(e.beschreibung)}`,
    `tags: ${einzeilig(e.tags)}`,
    `hinzugefuegt: ${datum}`,
  ].join('\n');

  if (e.typ === 'web') {
    return `---\n${kopf}\n---\n\n## So kannst du es einsetzen\n\n${e.tipp || ''}\n`;
  }
  return `---\n${kopf}\n---\n\n## Wofür ich es verwendet habe\n\n${e.einsatz || ''}\n\n` +
    `## Wo man es sonst einsetzen könnte\n\n${e.weitere || ''}\n\n## Prompt\n\n${e.prompt}\n`;
}

export function slugify(s) {
  return (
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'eintrag'
  );
}

function main() {
  const e = parseIssue(process.env.ISSUE_BODY);
  if (!e.name) throw new Error('Im Issue fehlt der Name.');

  // Dateiname muss über beide Ordner hinweg eindeutig sein.
  const existiert = (n) => Object.values(ORDNER).some((o) => fs.existsSync(path.join(root, o, `${n}.md`)));
  const base = slugify(e.name);
  let name = base;
  for (let i = 2; existiert(name); i++) name = `${base}-${i}`;

  const md = toMarkdown(e, new Date().toISOString().slice(0, 10));
  const ordner = ORDNER[e.typ];
  parseEintrag(e.typ, `${ordner}/${name}.md`, md); // gleiche Prüfung wie beim Bauen der Seite

  const datei = `${ordner}/${name}.md`;
  fs.mkdirSync(path.join(root, ordner), { recursive: true });
  fs.writeFileSync(path.join(root, datei), md);
  console.log(`Geschrieben: ${datei}`);

  if (process.env.GITHUB_OUTPUT) {
    const art = e.typ === 'skill' ? 'KI-Skill' : 'Web-Tool';
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `datei=${datei}\ntitel=${art}: ${einzeilig(e.name)}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
