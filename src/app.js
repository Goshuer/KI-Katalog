'use strict';

(() => {
// Sicherheit: Inhalte aus den Einträgen werden nur als Text (textContent) gesetzt, nie als HTML.
const { config, items } = JSON.parse(document.getElementById('data').textContent);
const categories = config.kategorien;
const tools = items.map((item, index) => ({ ...item, order: index }));

const TYPES = {
  '': 'Alle',
  web: 'Web-Tools',
  skill: 'KI-Skills',
};
const TYPE_SINGULAR = { web: 'Web-Tool', skill: 'KI-Skill' };

const byId = (id) => document.getElementById(id);
const icons = {
  research: '<circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.3 15.3 4.2 4.2"/>',
  design: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  writing: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
  media: '<path d="M3 12h3l2-5 3 10 3-12 3 9 2-2h2"/>',
  access: '<circle cx="12" cy="4.5" r="1.5"/><path d="m4 8 8 2 8-2m-8 2v5m0 0-4 6m4-6 4 6"/>',
  work: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
  files: '<path d="M3 6h7l2 3h9v10H3z"/>',
  other: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
  bookmark: '<path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z"/>',
};

function icon(name) {
  return '<svg aria-hidden="true" viewBox="0 0 24 24">' + (icons[name] ?? icons.other) + '</svg>';
}

function normalize(value) {
  return value.toLocaleLowerCase('de-CH').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ß/g, 'ss');
}

// Texte aus der Konfiguration
byId('brand-name').textContent = config.titel;
byId('footer-name').textContent = config.titel;
byId('headline').textContent = config.ueberschrift;
byId('headline-em').textContent = config.ueberschriftZusatz;
byId('intro').textContent = config.intro;

const collator = new Intl.Collator('de-CH', { sensitivity: 'base' });
const contributors = [...new Set(tools.flatMap((tool) => tool.contributors))].sort(collator.compare);
const platforms = [...new Set(tools.map((tool) => tool.platform).filter(Boolean))].sort(collator.compare);
const searchIndex = new Map(tools.map((tool) => [
  tool.id, normalize([
    tool.name, categories[tool.category], TYPE_SINGULAR[tool.typ], tool.description, tool.howItWorks, tool.platform,
    tool.usedFor, tool.otherUses, tool.prompt, ...tool.contributors, ...tool.tags,
  ].filter(Boolean).join(' ')),
]));

const storageKey = 'toolbox-bookmarks';
const saved = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  if (Array.isArray(stored)) {
    for (const tool of tools) {
      if (stored.includes(tool.id)) saved.add(tool.id);
    }
  }
} catch {
  // Browsing and session bookmarks still work if storage is unavailable.
}

const state = { type: '', category: '', view: 'browse' };
const search = byId('search');
const contributor = byId('contributor');
const platform = byId('platform');
const sort = byId('sort');
const cards = byId('cards');
const dialog = byId('detail');
const detailSave = byId('detail-save');
const categoryButtons = new Map();
const typeButtons = new Map();
let detailTool;
let detailOpener;

function setTile(tile, category) {
  tile.dataset.category = category;
  tile.innerHTML = icon(category);
}

function setTypePill(pill, tool) {
  pill.className = 'type-pill' + (tool.typ === 'skill' ? ' skill' : '');
  pill.textContent = TYPE_SINGULAR[tool.typ];
}

for (const [id, label] of Object.entries(TYPES)) {
  const button = document.createElement('button');
  button.type = 'button';
  const text = document.createElement('span');
  text.textContent = label;
  const count = document.createElement('span');
  count.className = 'type-count';
  button.append(text, count);
  button.addEventListener('click', () => {
    state.type = id;
    render();
  });
  byId('type-switch').append(button);
  typeButtons.set(id, { button, count });
}

for (const [id, label] of [['', 'Alle'], ...Object.entries(categories)]) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chip';
  button.textContent = label;
  button.addEventListener('click', () => {
    state.category = id;
    render();
  });
  byId('categories').append(button);
  categoryButtons.set(id, button);
}
for (const name of contributors) contributor.add(new Option(name, name));
for (const name of platforms) platform.add(new Option(name, name));

function filtersActive() {
  return Boolean(search.value.trim() || state.category || state.type || contributor.value || platform.value);
}

function clearFilters() {
  search.value = '';
  contributor.value = '';
  platform.value = '';
  state.category = '';
  state.type = '';
  render();
  search.focus();
}

function setView(view) {
  if (state.view === view) return;
  state.view = view;
  state.category = '';
  state.type = '';
  search.value = '';
  contributor.value = '';
  platform.value = '';
  render();
  byId('catalog').scrollIntoView({ block: 'start' });
}

function syncView() {
  const savedView = state.view === 'saved';
  byId('browse').setAttribute('aria-pressed', !savedView);
  byId('saved-view').setAttribute('aria-pressed', savedView);
  byId('catalog-title').textContent = savedView ? 'Deine Merkliste' : 'Bibliothek';
  search.placeholder = savedView ? 'In deiner Merkliste suchen …' : 'Tool, Skill oder Aufgabe suchen …';
  const count = byId('saved-count');
  count.textContent = saved.size;
  count.hidden = saved.size === 0;
}

// Alle Filter ausser dem Typ: daraus ergeben sich die Zahlen im Typ-Umschalter.
function matchWithoutType() {
  const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  return tools.filter((tool) =>
    (state.view !== 'saved' || saved.has(tool.id)) &&
    (!state.category || tool.category === state.category) &&
    (!contributor.value || tool.contributors.includes(contributor.value)) &&
    (!platform.value || tool.platform === platform.value) &&
    words.every((word) => searchIndex.get(tool.id).includes(word))
  );
}

function sortTools(list) {
  if (sort.value === 'az') return list.sort((a, b) => collator.compare(a.name, b.name));
  // Neueste zuerst; bei gleichem Datum KI-Skills vor Web-Tools, dann in Dateireihenfolge.
  return list.sort((a, b) =>
    (b.added || '').localeCompare(a.added || '') ||
    (a.typ === b.typ ? 0 : a.typ === 'skill' ? -1 : 1) ||
    a.order - b.order
  );
}

function syncBookmark(button, tool) {
  button.setAttribute('aria-pressed', saved.has(tool.id));
}

function toggleBookmark(tool) {
  if (saved.has(tool.id)) saved.delete(tool.id);
  else saved.add(tool.id);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
  } catch {
    // The in-memory bookmark remains available during this visit.
  }

  if (state.view === 'saved') {
    const nextToolId = [...cards.children].find((card) => card.dataset.id === tool.id)?.nextElementSibling?.dataset.id;
    render();
    if (!dialog.open) {
      const nextCard = [...cards.children].find((card) => card.dataset.id === nextToolId) ?? cards.firstElementChild;
      (nextCard?.querySelector('.bookmark') ?? byId('empty-action')).focus();
    }
  } else {
    syncView();
    const card = [...cards.children].find((item) => item.dataset.id === tool.id);
    if (card) syncBookmark(card.querySelector('.bookmark'), tool);
  }
  if (dialog.open) syncBookmark(detailSave, tool);
}

function createCard(tool) {
  const card = byId('tool-card').content.firstElementChild.cloneNode(true);
  card.dataset.id = tool.id;
  setTile(card.querySelector('.tile'), tool.category);
  setTypePill(card.querySelector('.type-pill'), tool);
  card.querySelector('.card-category').textContent =
    categories[tool.category] + (tool.typ === 'skill' && tool.platform ? ' · ' + tool.platform : '');
  card.querySelector('.card-description').textContent = tool.description;
  card.querySelector('.card-credit').textContent = tool.contributors.length ? 'Von ' + tool.contributors.join(', ') : '';
  const arrow = card.querySelector('.card-arrow');
  if (tool.typ === 'skill') {
    arrow.textContent = 'Prompt →';
    arrow.classList.add('skill-hint');
  } else {
    arrow.textContent = '↗';
  }
  const title = card.querySelector('.detail-trigger');
  title.textContent = tool.name;
  title.addEventListener('click', () => openDetail(tool, title));
  const bookmark = card.querySelector('.bookmark');
  bookmark.innerHTML = icon('bookmark');
  bookmark.setAttribute('aria-label', tool.name + ' merken');
  syncBookmark(bookmark, tool);
  bookmark.addEventListener('click', () => toggleBookmark(tool));
  return card;
}

function render() {
  syncView();
  for (const [id, button] of categoryButtons) button.setAttribute('aria-pressed', state.category === id);

  const base = matchWithoutType();
  for (const [id, { button, count }] of typeButtons) {
    button.setAttribute('aria-pressed', state.type === id);
    count.textContent = id ? base.filter((tool) => tool.typ === id).length : base.length;
  }

  byId('clear-search').hidden = !search.value;
  byId('reset').hidden = !filtersActive();
  const results = sortTools(base.filter((tool) => !state.type || tool.typ === state.type));
  const total = state.view === 'saved' ? saved.size : tools.length;
  const count = byId('result-count');
  const countLabel = filtersActive() ? results.length + ' von ' + total + ' Einträgen' : total + (total === 1 ? ' Eintrag' : ' Einträge');
  if (count.textContent !== countLabel) count.textContent = countLabel;
  cards.replaceChildren(...results.map(createCard));

  const empty = byId('empty');
  empty.hidden = results.length > 0;
  if (!empty.hidden) {
    const savedEmpty = state.view === 'saved' && saved.size === 0;
    byId('empty-title').textContent = savedEmpty ? 'Deine Merkliste ist leer' : 'Nichts gefunden';
    byId('empty-text').textContent = savedEmpty
      ? 'Merke dir Tools und Skills über das Lesezeichen auf der Karte.'
      : 'Versuche einen anderen Suchbegriff oder setze die Filter zurück.';
    byId('empty-action').textContent = savedEmpty ? 'Bibliothek entdecken' : 'Filter zurücksetzen';
  }
}

function openDetail(tool, opener) {
  const isSkill = tool.typ === 'skill';
  detailTool = tool;
  detailOpener = opener ?? null;
  dialog.classList.toggle('is-skill', isSkill);
  setTile(byId('detail-tile'), tool.category);
  setTypePill(byId('detail-type'), tool);
  byId('detail-category').textContent = categories[tool.category];
  byId('detail-title').textContent = tool.name;
  byId('detail-description').textContent = tool.description;
  byId('credit-label').textContent = isSkill ? 'Erstellt von' : 'Empfohlen von';
  byId('detail-credit').textContent = tool.contributors.join(', ') || '–';
  byId('detail-platform').textContent = tool.platform;
  byId('platform-meta').hidden = !tool.platform;

  const visit = byId('visit');
  if (!isSkill && tool.url) visit.href = tool.url;
  else visit.removeAttribute('href');
  visit.hidden = isSkill || !tool.url;

  // So funktioniert es / Verwendet für / Könnte man auch brauchen für
  const boxes = [['how-box', 'detail-how', tool.howItWorks], ['used-box', 'detail-used', tool.usedFor], ['other-box', 'detail-other', tool.otherUses]];
  for (const [box, text, value] of boxes) {
    byId(text).textContent = value ?? '';
    byId(box).hidden = !value;
  }
  byId('uses').hidden = boxes.every(([, , value]) => !value);

  byId('prompt-box').hidden = !isSkill;
  byId('copy').hidden = !isSkill;
  byId('copy').textContent = 'Prompt kopieren';
  byId('detail-prompt').textContent = tool.prompt ?? '';

  byId('detail-tags').replaceChildren(...tool.tags.map((tag) => {
    const item = document.createElement('li');
    item.textContent = tag;
    return item;
  }));
  syncBookmark(detailSave, tool);
  if (location.hash.slice(1) !== tool.id) history.replaceState(null, '', '#' + encodeURIComponent(tool.id));
  if (!dialog.open) dialog.showModal();
  byId('detail-prompt').scrollTop = 0;
  byId('close-detail').focus();
}

async function copyPrompt() {
  const button = byId('copy');
  try {
    await navigator.clipboard.writeText(detailTool.prompt);
  } catch {
    const area = document.createElement('textarea');
    area.value = detailTool.prompt;
    dialog.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  button.textContent = 'Kopiert ✓';
  setTimeout(() => { button.textContent = 'Prompt kopieren'; }, 2000);
}

function downloadPrompt() {
  const blob = new Blob([detailTool.prompt + '\n'], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = detailTool.id + '.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Direktlinks: …/#quellen-check öffnet den Eintrag sofort.
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const tool = tools.find((item) => item.id === id);
  if (tool) openDetail(tool);
  else if (dialog.open) dialog.close();
}

byId('browse').addEventListener('click', () => setView('browse'));
byId('saved-view').addEventListener('click', () => setView('saved'));
byId('clear-search').addEventListener('click', () => {
  search.value = '';
  render();
  search.focus();
});
byId('reset').addEventListener('click', clearFilters);
byId('empty-action').addEventListener('click', () => {
  if (state.view === 'saved' && saved.size === 0) setView('browse');
  else clearFilters();
});
search.addEventListener('input', render);
contributor.addEventListener('change', render);
platform.addEventListener('change', render);
sort.addEventListener('change', render);

detailSave.innerHTML = icon('bookmark') + '<span>Merken</span>';
byId('close-detail').addEventListener('click', () => dialog.close());
byId('copy').addEventListener('click', copyPrompt);
byId('download').addEventListener('click', downloadPrompt);
detailSave.addEventListener('click', () => toggleBookmark(detailTool));
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (detailOpener?.isConnected) detailOpener.focus();
  else {
    const card = [...cards.children].find((item) => item.dataset.id === detailTool.id) ?? cards.firstElementChild;
    (card?.querySelector('.detail-trigger') ?? byId('empty-action')).focus();
  }
});
window.addEventListener('hashchange', openFromHash);

// ---------- Eingabemaske ----------
// Mit "endpoint" (Cloudflare Worker) öffnet "+ Einreichen" das Formular hier auf der Seite.
// Ohne endpoint führt der Knopf als Notlösung zum Formular auf GitHub.
const submitCfg = config.einreichen ?? {};
const submitOpen = byId('submit-open');
const submitDialog = byId('submit-dialog');
const form = byId('submit-form');
const f = form.elements;
const githubForm = config.repository ? config.repository.replace(/\/$/, '') + '/issues/new/choose' : '';

if (submitCfg.endpoint || githubForm) submitOpen.hidden = false;

const fill = (select, options) => select.replaceChildren(
  new Option('Bitte wählen …', ''), ...options.map(([value, label]) => new Option(label, value)));
fill(f.kategorie, Object.values(categories).map((label) => [label, label]));
byId('kurs-code-field').hidden = !submitCfg.kursCode;

const TYPE_TEXT = {
  skill: {
    hint: 'Ein Prompt oder Assistent, den du mit ChatGPT, Claude, Copilot o. Ä. gebaut hast.', von: 'Erstellt von', title: 'Teile deinen KI-Skill',
    beschreibung: 'Ein Satz, z. B. «… Feedback zu eigenen Texten, ohne sie umzuschreiben.»',
    funktion: 'Was gibst du ein, was macht der Skill daraus? Z. B. «Du fügst deinen Text ein, der Skill fragt nach der Zielgruppe und gibt Feedback in vier Bereichen.»',
  },
  web: {
    hint: 'Eine Website, App oder Browser-Erweiterung, die dir bei der Arbeit hilft.', von: 'Empfohlen von', title: 'Empfiehl ein Web-Tool',
    beschreibung: 'Ein Satz, z. B. «… Quellen zu einem Thema sammeln und zusammenfassen.»',
    funktion: 'Ein konkreter Tipp, wie man es einsetzt. Z. B. «Eigene PDFs hochladen und daraus eine Mindmap erstellen.»',
  },
};

function formType() {
  return form.querySelector('input[name="typ"]:checked').value;
}

function syncFormType() {
  const typ = formType();
  for (const el of form.querySelectorAll('[data-only]')) el.hidden = el.dataset.only !== typ;
  const current = f.plattform.value;
  fill(f.plattform, (typ === 'skill' ? submitCfg.plattformenSkill : submitCfg.plattformenWeb ?? []).map((p) => [p, p]));
  f.plattform.value = current;
  byId('typ-hint').textContent = TYPE_TEXT[typ].hint;
  byId('von-label').textContent = TYPE_TEXT[typ].von;
  byId('submit-title').textContent = TYPE_TEXT[typ].title;
  for (const hint of form.querySelectorAll('[data-hint]')) hint.textContent = TYPE_TEXT[typ][hint.dataset.hint];
}

function showDone(done) {
  byId('submit-fields').hidden = done;
  byId('submit-done').hidden = !done;
}

function formError(message, field) {
  const box = byId('submit-error');
  box.textContent = message;
  box.hidden = !message;
  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.focus();
  }
}

function validate() {
  for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  const typ = formType();
  const need = [
    [f.name, 'Bitte gib einen Namen ein.'],
    [f.plattform, 'Bitte wähle eine Plattform.'],
    [f.kategorie, 'Bitte wähle eine Kategorie.'],
    [f.beschreibung, 'Bitte ergänze «Das Tool ist für …».'],
    [f.funktion, 'Bitte ergänze «Es funktioniert so …».'],
    ...(typ === 'skill' ? [[f.prompt, 'Bitte füge den Prompt ein.']] : []),
    ...(submitCfg.kursCode ? [[f.kursCode, 'Bitte gib den Kurs-Code ein.']] : []),
  ];
  for (const [field, message] of need) {
    if (!field.value.trim()) return formError(message, field), false;
  }
  if (typ === 'web' && f.url.value.trim() && !/^https?:\/\/\S+\.\S+/i.test(f.url.value.trim())) {
    return formError('Der Link muss mit https:// beginnen.', f.url), false;
  }
  formError('');
  return true;
}

submitOpen.addEventListener('click', () => {
  if (!submitCfg.endpoint) {
    window.open(githubForm, '_blank', 'noopener');
    return;
  }
  showDone(false);
  syncFormType();
  formError('');
  submitDialog.showModal();
  f.name.focus();
});

for (const radio of form.querySelectorAll('input[name="typ"]')) radio.addEventListener('change', syncFormType);
for (const el of form.querySelectorAll('input, textarea, select')) {
  el.addEventListener('input', () => {
    if (el.hasAttribute('aria-invalid')) formError('');
    el.removeAttribute('aria-invalid');
  });
}
byId('submit-close').addEventListener('click', () => submitDialog.close());
for (const button of form.querySelectorAll('[data-close]')) button.addEventListener('click', () => submitDialog.close());
byId('submit-another').addEventListener('click', () => {
  const typ = formType();
  const von = f.von.value;
  const code = f.kursCode.value;
  form.reset();
  form.querySelector(`input[name="typ"][value="${typ}"]`).checked = true;
  f.von.value = von;
  f.kursCode.value = code;
  syncFormType();
  showDone(false);
  f.name.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validate()) return;
  const send = byId('submit-send');
  const data = Object.fromEntries(new FormData(form));
  send.disabled = true;
  send.textContent = 'Wird gesendet …';
  try {
    const response = await fetch(submitCfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.fehler || 'Das Senden hat nicht geklappt.');
    showDone(true);
    byId('submit-done').querySelector('[data-close]').focus();
  } catch (error) {
    formError((error instanceof TypeError ? 'Keine Verbindung. Bitte versuch es nochmals.' : error.message));
  } finally {
    send.disabled = false;
    send.textContent = 'Einreichen';
  }
});

render();
openFromHash();

})();
