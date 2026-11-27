(() => {
  'use strict';
  // Sicherheit: Inhalte aus den Tool-Dateien werden nur als Text (textContent) gesetzt,
  // nie als HTML. So kann ein eingereichter Text keinen Code auf der Seite ausführen.
  const { config, tools } = JSON.parse(document.getElementById('daten').textContent);
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const plattformKlasse = (p) => {
    const s = p.toLowerCase();
    if (s.includes('chatgpt') || s.includes('openai')) return 'p-chatgpt';
    if (s.includes('claude')) return 'p-claude';
    if (s.includes('copilot')) return 'p-copilot';
    if (s.includes('gemini')) return 'p-gemini';
    return 'p-andere';
  };

  // Kopf
  $('titel').textContent = config.titel;
  $('untertitel').textContent = config.untertitel || '';
  if (config.repository) {
    const a = $('einreichen');
    a.href = config.repository.replace(/\/$/, '') + '/issues/new?template=neues-tool.yml';
    a.hidden = false;
  }

  // Filter
  const zustand = { suche: '', plattform: new Set(), kategorie: new Set() };
  const einmalig = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'de'));

  function chips(container, werte, set, mitFarbe) {
    for (const w of werte) {
      const b = el('button', 'chip' + (mitFarbe ? ' ' + plattformKlasse(w) : ''), w);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        set.has(w) ? set.delete(w) : set.add(w);
        b.setAttribute('aria-pressed', String(set.has(w)));
        render();
      });
      container.append(b);
    }
  }
  chips($('filter-plattform'), einmalig(tools.map((t) => t.plattform)), zustand.plattform, true);
  chips($('filter-kategorie'), einmalig(tools.flatMap((t) => t.kategorien)), zustand.kategorie, false);

  let timer;
  $('suche').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { zustand.suche = e.target.value.trim().toLowerCase(); render(); }, 120);
  });

  const passt = (t) => {
    if (zustand.plattform.size && !zustand.plattform.has(t.plattform)) return false;
    if (zustand.kategorie.size && !t.kategorien.some((k) => zustand.kategorie.has(k))) return false;
    if (!zustand.suche) return true;
    const text = [t.titel, t.kurzbeschreibung, t.einsatz, t.weitere, t.erstelltVon, t.plattform, ...t.kategorien]
      .join(' ').toLowerCase();
    return zustand.suche.split(/\s+/).every((w) => text.includes(w));
  };

  // Liste
  function karte(t) {
    const k = el('button', 'karte');
    k.type = 'button';
    k.addEventListener('click', () => { location.hash = t.id; });
    k.append(el('span', 'badge ' + plattformKlasse(t.plattform), t.plattform));
    k.append(el('h2', 'karte-titel', t.titel));
    if (t.kurzbeschreibung) k.append(el('p', 'karte-text', t.kurzbeschreibung));
    const fuss = el('div', 'karte-fuss');
    const tags = el('div', 'tags');
    t.kategorien.forEach((kat) => tags.append(el('span', 'tag', kat)));
    fuss.append(tags);
    if (t.erstelltVon) fuss.append(el('span', 'von', t.erstelltVon));
    k.append(fuss);
    return k;
  }

  function render() {
    const treffer = tools.filter(passt);
    $('liste').replaceChildren(...treffer.map(karte));
    $('leer').hidden = treffer.length > 0;
    $('anzahl').textContent = treffer.length === tools.length
      ? `${tools.length} ${tools.length === 1 ? 'Tool' : 'Tools'}`
      : `${treffer.length} von ${tools.length} Tools`;
  }

  // Detailansicht (über #tool-name direkt verlinkbar)
  const dialog = $('detail');
  let aktuell = null;

  function oeffnen(t) {
    aktuell = t;
    const badge = $('d-plattform');
    badge.className = 'badge ' + plattformKlasse(t.plattform);
    badge.textContent = t.plattform;
    $('d-titel').textContent = t.titel;
    $('d-meta').textContent = [t.erstelltVon && `Erstellt von ${t.erstelltVon}`, t.kategorien.join(', ')]
      .filter(Boolean).join(' · ');
    $('d-kurz').textContent = t.kurzbeschreibung;
    $('d-einsatz').textContent = t.einsatz || '–';
    $('d-weitere').textContent = t.weitere || '–';
    $('d-prompt').textContent = t.prompt;
    $('d-kopieren').textContent = 'Kopieren';
    if (!dialog.open) dialog.showModal();
    $('d-prompt').scrollTop = 0;
  }

  function ausHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = tools.find((x) => x.id === id);
    if (t) oeffnen(t);
    else if (dialog.open) dialog.close();
  }

  dialog.addEventListener('close', () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  $('d-schliessen').addEventListener('click', () => dialog.close());

  $('d-kopieren').addEventListener('click', async () => {
    const btn = $('d-kopieren');
    try {
      await navigator.clipboard.writeText(aktuell.prompt);
    } catch {
      const ta = el('textarea');
      ta.value = aktuell.prompt;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    btn.textContent = 'Kopiert ✓';
    setTimeout(() => { btn.textContent = 'Kopieren'; }, 2000);
  });

  $('d-download').addEventListener('click', () => {
    const blob = new Blob([aktuell.prompt + '\n'], { type: 'text/markdown;charset=utf-8' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = aktuell.id + '.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  window.addEventListener('hashchange', ausHash);
  render();
  ausHash();
})();
