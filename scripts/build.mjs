// Baut die Katalogseite: liest alle Tools aus tools/*.md und schreibt dist/index.html.
// Alles (Daten, Stil, Skript) landet in einer einzigen Datei, damit der
// optionale Passwortschutz (StatiCrypt) die ganze Seite verschlüsseln kann.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsDir = path.join(root, 'tools');
const outDir = path.join(root, 'dist');

export function parseTool(file, raw) {
  raw = raw.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: Der Kopfbereich zwischen --- und --- fehlt.`);

  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0 || line.trim().startsWith('#')) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    meta[key] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }

  const body = m[2];
  const promptMatch = body.match(/^##\s+Prompt\s*$/m);
  if (!promptMatch) throw new Error(`${file}: Der Abschnitt "## Prompt" fehlt.`);
  // Alles nach "## Prompt" ist der Prompt, unverändert (darf selbst Überschriften enthalten).
  const prompt = body.slice(promptMatch.index + promptMatch[0].length).trim();

  const sections = { einsatz: '', weitere: '' };
  for (const chunk of body.slice(0, promptMatch.index).split(/^##\s+/m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const head = (nl < 0 ? chunk : chunk.slice(0, nl)).trim().toLowerCase();
    const text = nl < 0 ? '' : chunk.slice(nl + 1).trim();
    if (head.startsWith('wofür') || head.startsWith('wofuer')) sections.einsatz = text;
    else if (head.includes('sonst') || head.includes('weitere')) sections.weitere = text;
  }

  if (!meta.titel) throw new Error(`${file}: Das Feld "titel" fehlt.`);
  if (!prompt) throw new Error(`${file}: Der Prompt ist leer.`);

  return {
    id: path.basename(file, '.md'),
    titel: meta.titel,
    erstelltVon: meta.erstellt_von || '',
    plattform: meta.plattform || 'Andere',
    kategorien: (meta.kategorie || '').split(',').map((s) => s.trim()).filter(Boolean),
    kurzbeschreibung: meta.kurzbeschreibung || '',
    einsatz: sections.einsatz,
    weitere: sections.weitere,
    prompt,
  };
}

function build() {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'katalog.config.json'), 'utf8'));
  if (!config.repository && process.env.GITHUB_REPOSITORY) {
    config.repository = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
  }

  const tools = fs
    .readdirSync(toolsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseTool(f, fs.readFileSync(path.join(toolsDir, f), 'utf8')))
    .sort((a, b) => a.titel.localeCompare(b.titel, 'de'));

  // JSON sicher in <script> einbetten: "<" maskieren, damit kein Text das Tag schliessen kann.
  const json = JSON.stringify({ config, tools }).replace(/</g, '\\u003c');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const html = fs
    .readFileSync(path.join(root, 'src/index.html'), 'utf8')
    .replaceAll('{{TITEL}}', esc(config.titel))
    .replace('/*STYLE*/', () => fs.readFileSync(path.join(root, 'src/style.css'), 'utf8'))
    .replace('/*SCRIPT*/', () => fs.readFileSync(path.join(root, 'src/app.js'), 'utf8'))
    .replace('/*DATA*/', () => json);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  console.log(`Katalog gebaut: ${tools.length} Tools → dist/index.html`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
