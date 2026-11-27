// Baut die Toolbox-Seite aus web-tools/*.md und ki-skills/*.md → dist/index.html.
// Alles (Daten, Stil, Skript) landet in einer Datei, damit der optionale
// Passwortschutz (StatiCrypt) die ganze Seite verschlüsseln kann.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const config = JSON.parse(fs.readFileSync(path.join(root, 'katalog.config.json'), 'utf8'));

export const ORDNER = { web: 'web-tools', skill: 'ki-skills' };

function frontMatter(file, raw) {
  raw = raw.replace(/\r\n/g, '\n').replace(/^﻿/, '');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: Der Kopfbereich zwischen --- und --- fehlt.`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0 || line.trim().startsWith('#')) continue;
    meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return { meta, body: m[2] };
}

function abschnitte(text) {
  const out = [];
  for (const chunk of text.split(/^##\s+/m).slice(1)) {
    const nl = chunk.indexOf('\n');
    out.push({
      titel: (nl < 0 ? chunk : chunk.slice(0, nl)).trim().toLowerCase(),
      text: nl < 0 ? '' : chunk.slice(nl + 1).trim(),
    });
  }
  return out;
}

const liste = (s = '') => s.split(',').map((x) => x.trim()).filter(Boolean);

// Kategorie darf als Schlüssel (z. B. "research") oder als Bezeichnung ("KI & Recherche") stehen.
export function kategorieSchluessel(wert, file) {
  const w = (wert || '').trim().toLowerCase();
  for (const [key, label] of Object.entries(config.kategorien)) {
    if (w === key || w === label.toLowerCase()) return key;
  }
  throw new Error(`${file}: Unbekannte Kategorie "${wert}". Erlaubt: ${Object.keys(config.kategorien).join(', ')}`);
}

// Nur echte Web-Adressen zulassen (kein "javascript:" o. Ä.).
function sichereUrl(url, file) {
  if (!url) return '';
  let u;
  try { u = new URL(url); } catch { throw new Error(`${file}: Ungültiger Link "${url}".`); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error(`${file}: Link muss mit https:// beginnen.`);
  return u.href;
}

export function parseEintrag(typ, file, raw) {
  const { meta, body } = frontMatter(file, raw);
  if (!meta.name) throw new Error(`${file}: Das Feld "name" fehlt.`);

  const eintrag = {
    id: path.basename(file, '.md'),
    typ,
    name: meta.name,
    category: kategorieSchluessel(meta.kategorie, file),
    contributors: liste(meta.von),
    platform: meta.plattform || '',
    description: meta.beschreibung || '',
    tags: liste(meta.tags),
    added: meta.hinzugefuegt || '',
  };

  if (typ === 'web') {
    eintrag.url = sichereUrl(meta.url, file);
    eintrag.tip = abschnitte(body).find((a) => a.titel.includes('einsetzen'))?.text || '';
    return eintrag;
  }

  // KI-Skill: Alles nach "## Prompt" ist der Prompt, unverändert (darf selbst Überschriften enthalten).
  const pm = body.match(/^##\s+Prompt\s*$/m);
  if (!pm) throw new Error(`${file}: Der Abschnitt "## Prompt" fehlt.`);
  eintrag.prompt = body.slice(pm.index + pm[0].length).trim();
  if (!eintrag.prompt) throw new Error(`${file}: Der Prompt ist leer.`);
  for (const a of abschnitte(body.slice(0, pm.index))) {
    if (a.titel.startsWith('wofür') || a.titel.startsWith('wofuer')) eintrag.usedFor = a.text;
    else if (a.titel.includes('sonst') || a.titel.includes('weitere')) eintrag.otherUses = a.text;
  }
  return eintrag;
}

function build() {
  const cfg = { ...config };
  if (!cfg.repository && process.env.GITHUB_REPOSITORY) cfg.repository = `https://github.com/${process.env.GITHUB_REPOSITORY}`;

  const items = [];
  const ids = new Set();
  for (const [typ, ordner] of Object.entries(ORDNER)) {
    const dir = path.join(root, ordner);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const e = parseEintrag(typ, `${ordner}/${f}`, fs.readFileSync(path.join(dir, f), 'utf8'));
      if (ids.has(e.id)) throw new Error(`${ordner}/${f}: Der Dateiname "${e.id}" existiert schon im anderen Ordner.`);
      ids.add(e.id);
      items.push(e);
    }
  }

  // JSON sicher in <script> einbetten: "<" maskieren, damit kein Text das Tag schliessen kann.
  const json = JSON.stringify({ config: cfg, items }).replace(/</g, '\\u003c');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const html = fs
    .readFileSync(path.join(root, 'src/index.html'), 'utf8')
    .replaceAll('{{TITEL}}', esc(cfg.titel))
    .replaceAll('{{KICKER}}', esc(cfg.kicker))
    .replace('/*STYLE*/', () => fs.readFileSync(path.join(root, 'src/style.css'), 'utf8'))
    .replace('/*SCRIPT*/', () => fs.readFileSync(path.join(root, 'src/app.js'), 'utf8'))
    .replace('/*DATA*/', () => json);

  const outDir = path.join(root, 'dist');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  const n = (t) => items.filter((i) => i.typ === t).length;
  console.log(`Toolbox gebaut: ${n('web')} Web-Tools, ${n('skill')} KI-Skills → dist/index.html`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
