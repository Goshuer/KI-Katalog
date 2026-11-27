// Wandelt ein freigegebenes GitHub-Issue (aus dem Formular "Neues Tool einreichen")
// in eine Datei tools/<name>.md um. Wird von .github/workflows/tool-aufnehmen.yml aufgerufen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTool } from './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Diese Beschriftungen müssen genau den "label"-Feldern im Issue-Formular entsprechen.
const FELDER = {
  'Name des Tools': 'titel',
  'Erstellt von': 'erstellt_von',
  'Plattform': 'plattform',
  'Kategorie': 'kategorie',
  'Kurzbeschreibung': 'kurzbeschreibung',
  'Wofür hast du es verwendet?': 'einsatz',
  'Wo könnte man es sonst noch einsetzen?': 'weitere',
};
const PROMPT_LABEL = 'Prompt / Anweisungen';

export function parseIssue(body) {
  body = body.replace(/\r\n/g, '\n');
  const leer = (v) => (v.trim() === '_No response_' ? '' : v.trim());

  const promptHead = `### ${PROMPT_LABEL}`;
  const p = body.indexOf(promptHead);
  if (p < 0) throw new Error('Im Issue fehlt das Feld "Prompt / Anweisungen".');
  const prompt = leer(body.slice(p + promptHead.length));

  const werte = {};
  for (const chunk of body.slice(0, p).split(/^### /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const label = chunk.slice(0, nl).trim();
    if (FELDER[label]) werte[FELDER[label]] = leer(chunk.slice(nl + 1));
  }
  return { ...werte, prompt };
}

const einzeilig = (s = '') => s.replace(/\s+/g, ' ').trim();

export function toMarkdown(t) {
  return `---
titel: ${einzeilig(t.titel)}
erstellt_von: ${einzeilig(t.erstellt_von)}
plattform: ${einzeilig(t.plattform)}
kategorie: ${einzeilig(t.kategorie)}
kurzbeschreibung: ${einzeilig(t.kurzbeschreibung)}
---

## Wofür ich es verwendet habe

${t.einsatz || ''}

## Wo man es sonst einsetzen könnte

${t.weitere || ''}

## Prompt

${t.prompt}
`;
}

export function slugify(s) {
  return (
    s.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'tool'
  );
}

function main() {
  const tool = parseIssue(process.env.ISSUE_BODY || '');
  if (!tool.titel) throw new Error('Im Issue fehlt der Name des Tools.');

  const base = slugify(tool.titel);
  let name = base;
  for (let n = 2; fs.existsSync(path.join(root, 'tools', `${name}.md`)); n++) name = `${base}-${n}`;

  const md = toMarkdown(tool);
  parseTool(`${name}.md`, md); // gleiche Prüfung wie beim Bauen der Seite

  const datei = `tools/${name}.md`;
  fs.writeFileSync(path.join(root, datei), md);
  console.log(`Geschrieben: ${datei}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `datei=${datei}\ntitel=${einzeilig(tool.titel)}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
